import { AudioAnalysis, EqualizerSettings, AudioProofSettings, AudioProofMetrics, ComfortMode, Track } from '../types';

export const DEFAULT_AUDIO_PROOF: AudioProofSettings = {
  limiterEnabled: true,
  ceilingDb: -1.5,
  limiterThreshold: -12,
  autoGainControl: true,
  antiHarshDeEsser: true,
  ultrasonicFilter: true,
  softSaturation: true,
  comfortMode: 'safe_master',
  nightMode: false,
  earFatigueGuard: true,
};

function generateSoftClippingCurve(samples = 2048): Float32Array {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    // Smooth tanh saturation curve prevents harsh digital square clipping
    curve[i] = Math.tanh(x * 1.15) * 0.96;
  }
  return curve;
}

export class AudioEngine {
  private static instance: AudioEngine;

  public audioCtx: AudioContext | null = null;
  public analyser: AnalyserNode | null = null;
  public mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  // Master DSP Chain Nodes
  public inputGainNode: GainNode | null = null;
  public agcGainNode: GainNode | null = null;
  public dynamicsCompressor: DynamicsCompressorNode | null = null;
  public brickwallLimiter: DynamicsCompressorNode | null = null;
  public softClipperNode: WaveShaperNode | null = null;
  public masterGain: GainNode | null = null;
  public bassBoostFilter: BiquadFilterNode | null = null;
  public deEsserFilter: BiquadFilterNode | null = null;
  public ultrasonicFilterNode: BiquadFilterNode | null = null;
  public nightModeFilter: BiquadFilterNode | null = null;

  // 5-Band Equalizer Filters
  public eqFilters: {
    subBass: BiquadFilterNode;
    bass: BiquadFilterNode;
    mid: BiquadFilterNode;
    high: BiquadFilterNode;
    treble: BiquadFilterNode;
  } | null = null;

  // Audio Sources
  private audioElement: HTMLAudioElement | null = null;
  private audioSourceNode: MediaElementAudioSourceNode | null = null;
  public microphone: MediaStreamAudioSourceNode | null = null;

  // Analysis Buffers & Metrics
  private freqData: Uint8Array | null = null;
  private timeData: Uint8Array | null = null;
  private beatCutoff = 0;
  private beatDecayRate = 0.96;
  private energyHistory: number[] = [];

  // Audio Proofing & Safety State
  public audioProofSettings: AudioProofSettings = { ...DEFAULT_AUDIO_PROOF };
  private clippingPreventedCount = 0;
  private lastRmsValue = 0.3;
  private agcTargetGain = 1.0;
  private currentAgcGain = 1.0;

  // Playback State
  public currentTrack: Track | null = null;
  public isPlaying = false;
  public isMuted = false;
  public volume = 0.85;
  public currentTime = 0;
  public duration = 0;

  // Callbacks
  private onTrackEndCallback?: () => void;
  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public init() {
    if (!this.audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx();

      // Setup Analyser
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.82;
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);

      // Setup MediaStream Destination for Video Recording with Audio
      this.mediaStreamDest = this.audioCtx.createMediaStreamDestination();

      // 1. Input Gain & Auto Gain Leveler (AGC)
      this.inputGainNode = this.audioCtx.createGain();
      this.inputGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      this.agcGainNode = this.audioCtx.createGain();
      this.agcGainNode.gain.setValueAtTime(1.0, this.audioCtx.currentTime);

      // 2. Ultrasonic Anti-Aliasing Guard (>18.5 kHz)
      this.ultrasonicFilterNode = this.audioCtx.createBiquadFilter();
      this.ultrasonicFilterNode.type = 'lowpass';
      this.ultrasonicFilterNode.frequency.setValueAtTime(18500, this.audioCtx.currentTime);
      this.ultrasonicFilterNode.Q.setValueAtTime(0.707, this.audioCtx.currentTime);

      // 3. De-Esser / Anti-Harsh Frequency Tamer (Peaking dip around 6.5kHz)
      this.deEsserFilter = this.audioCtx.createBiquadFilter();
      this.deEsserFilter.type = 'peaking';
      this.deEsserFilter.frequency.setValueAtTime(6500, this.audioCtx.currentTime);
      this.deEsserFilter.Q.setValueAtTime(2.2, this.audioCtx.currentTime);
      this.deEsserFilter.gain.setValueAtTime(-2.5, this.audioCtx.currentTime); // Soft de-essing by default

      // 4. Night Mode / Warmth Contour Filter
      this.nightModeFilter = this.audioCtx.createBiquadFilter();
      this.nightModeFilter.type = 'highshelf';
      this.nightModeFilter.frequency.setValueAtTime(8000, this.audioCtx.currentTime);
      this.nightModeFilter.gain.setValueAtTime(0, this.audioCtx.currentTime);

      // 5. 5-Band Equalizer Filters
      const subBass = this.audioCtx.createBiquadFilter();
      subBass.type = 'lowshelf';
      subBass.frequency.value = 60;

      const bass = this.audioCtx.createBiquadFilter();
      bass.type = 'peaking';
      bass.frequency.value = 250;
      bass.Q.value = 1.0;

      const mid = this.audioCtx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1.0;

      const high = this.audioCtx.createBiquadFilter();
      high.type = 'peaking';
      high.frequency.value = 4000;
      high.Q.value = 1.0;

      const treble = this.audioCtx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 12000;

      this.eqFilters = { subBass, bass, mid, high, treble };

      // 6. Sub-Harmonic Bass Boost Filter
      this.bassBoostFilter = this.audioCtx.createBiquadFilter();
      this.bassBoostFilter.type = 'lowshelf';
      this.bassBoostFilter.frequency.setValueAtTime(80, this.audioCtx.currentTime);
      this.bassBoostFilter.gain.setValueAtTime(3, this.audioCtx.currentTime);

      // 7. Stage 1: Studio Dynamics Compressor (RMS leveling & tonal control)
      this.dynamicsCompressor = this.audioCtx.createDynamicsCompressor();
      this.dynamicsCompressor.threshold.setValueAtTime(-14, this.audioCtx.currentTime);
      this.dynamicsCompressor.knee.setValueAtTime(24, this.audioCtx.currentTime);
      this.dynamicsCompressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
      this.dynamicsCompressor.attack.setValueAtTime(0.005, this.audioCtx.currentTime);
      this.dynamicsCompressor.release.setValueAtTime(0.18, this.audioCtx.currentTime);

      // 8. Stage 2: True-Peak Brickwall Limiter (Prevents sudden loud peaks / ear blasts)
      this.brickwallLimiter = this.audioCtx.createDynamicsCompressor();
      this.brickwallLimiter.threshold.setValueAtTime(-1.5, this.audioCtx.currentTime);
      this.brickwallLimiter.knee.setValueAtTime(0.0, this.audioCtx.currentTime); // Hard brickwall knee
      this.brickwallLimiter.ratio.setValueAtTime(20.0, this.audioCtx.currentTime); // Infinite limiter ratio
      this.brickwallLimiter.attack.setValueAtTime(0.001, this.audioCtx.currentTime); // 1ms peak clamp
      this.brickwallLimiter.release.setValueAtTime(0.05, this.audioCtx.currentTime); // Fast recovery

      // 9. Stage 3: Soft-Knee Analog Waveshaper (Soft-Clipper prevents harsh digital wrap-around)
      this.softClipperNode = this.audioCtx.createWaveShaper();
      this.softClipperNode.curve = generateSoftClippingCurve();
      this.softClipperNode.oversample = '4x'; // 4x oversampling for zero aliasing

      // 10. Master Output Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      // Wire Complete Audio Graph:
      // InputGain -> AGCGain -> UltrasonicFilter -> DeEsser -> NightFilter -> EQ(5) -> BassBoost -> DynamicsCompressor -> BrickwallLimiter -> SoftClipper -> MasterGain -> Analyser -> Speakers & Recorder
      this.inputGainNode.connect(this.agcGainNode);
      this.agcGainNode.connect(this.ultrasonicFilterNode);
      this.ultrasonicFilterNode.connect(this.deEsserFilter);
      this.deEsserFilter.connect(this.nightModeFilter);

      this.nightModeFilter.connect(subBass);
      subBass.connect(bass);
      bass.connect(mid);
      mid.connect(high);
      high.connect(treble);
      treble.connect(this.bassBoostFilter);

      this.bassBoostFilter.connect(this.dynamicsCompressor);
      this.dynamicsCompressor.connect(this.brickwallLimiter);
      this.brickwallLimiter.connect(this.softClipperNode);
      this.softClipperNode.connect(this.masterGain);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
      this.analyser.connect(this.mediaStreamDest);

      // Setup HTML5 Audio Element for Local Files & Live Streams
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'auto';

      this.audioSourceNode = this.audioCtx.createMediaElementSource(this.audioElement);
      this.audioSourceNode.connect(this.inputGainNode);

      this.audioElement.addEventListener('timeupdate', () => {
        if (this.audioElement && this.currentTrack?.type === 'file') {
          this.currentTime = this.audioElement.currentTime;
          this.duration = this.audioElement.duration || this.currentTrack.duration || 0;
          if (this.onTimeUpdateCallback) {
            this.onTimeUpdateCallback(this.currentTime, this.duration);
          }
        }
      });

      this.audioElement.addEventListener('ended', () => {
        this.isPlaying = false;
        if (this.onTrackEndCallback) {
          this.onTrackEndCallback();
        }
      });

      this.audioElement.addEventListener('error', (e) => {
        console.warn('HTML5 Audio playback error:', e);
      });
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setCallbacks(
    onTrackEnd?: () => void,
    onTimeUpdate?: (curr: number, dur: number) => void
  ) {
    this.onTrackEndCallback = onTrackEnd;
    this.onTimeUpdateCallback = onTimeUpdate;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      // Smooth volume transitions to avoid crackle
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : this.volume,
        now + 0.05
      );
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.setVolume(this.volume);
    return this.isMuted;
  }

  public setEqualizer(settings: EqualizerSettings) {
    if (!this.eqFilters || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    this.eqFilters.subBass.gain.setValueAtTime(settings.subBass, now);
    this.eqFilters.bass.gain.setValueAtTime(settings.bass, now);
    this.eqFilters.mid.gain.setValueAtTime(settings.mid, now);
    this.eqFilters.high.gain.setValueAtTime(settings.high, now);
    this.eqFilters.treble.gain.setValueAtTime(settings.treble, now);

    if (this.bassBoostFilter) {
      this.bassBoostFilter.gain.setValueAtTime(settings.bassBoost ?? 3, now);
    }

    if (settings.audioProof) {
      this.setAudioProofSettings(settings.audioProof);
    } else if (this.dynamicsCompressor && this.brickwallLimiter) {
      const ratio = settings.dynamicsLimiter ? 14 : 4;
      this.dynamicsCompressor.ratio.setValueAtTime(ratio, now);
    }
  }

  /**
   * Apply Comprehensive Audio Proofing & User Hearing Comfort Configuration
   */
  public setAudioProofSettings(proof: Partial<AudioProofSettings>) {
    this.audioProofSettings = { ...this.audioProofSettings, ...proof };
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // 1. Brickwall Limiter & Threshold
    if (this.brickwallLimiter) {
      if (this.audioProofSettings.limiterEnabled) {
        this.brickwallLimiter.threshold.setValueAtTime(this.audioProofSettings.ceilingDb || -1.5, now);
        this.brickwallLimiter.ratio.setValueAtTime(20.0, now);
        this.brickwallLimiter.attack.setValueAtTime(0.001, now);
      } else {
        this.brickwallLimiter.threshold.setValueAtTime(0, now);
        this.brickwallLimiter.ratio.setValueAtTime(1, now);
      }
    }

    // 2. Stage 1 Dynamics Compressor
    if (this.dynamicsCompressor) {
      const threshold = this.audioProofSettings.limiterThreshold || -12;
      this.dynamicsCompressor.threshold.setValueAtTime(threshold, now);
      if (this.audioProofSettings.comfortMode === 'night_mode') {
        this.dynamicsCompressor.ratio.setValueAtTime(16, now);
        this.dynamicsCompressor.threshold.setValueAtTime(-18, now);
      } else if (this.audioProofSettings.comfortMode === 'anti_harsh') {
        this.dynamicsCompressor.ratio.setValueAtTime(10, now);
      } else if (this.audioProofSettings.comfortMode === 'bass_protect') {
        this.dynamicsCompressor.ratio.setValueAtTime(12, now);
      } else {
        this.dynamicsCompressor.ratio.setValueAtTime(8, now);
      }
    }

    // 3. De-Esser / Anti-Harsh Tamer (6.5kHz)
    if (this.deEsserFilter) {
      if (this.audioProofSettings.antiHarshDeEsser || this.audioProofSettings.comfortMode === 'anti_harsh') {
        this.deEsserFilter.gain.setValueAtTime(-4.5, now);
      } else {
        this.deEsserFilter.gain.setValueAtTime(0, now);
      }
    }

    // 4. Ultrasonic Filter (>18.5kHz)
    if (this.ultrasonicFilterNode) {
      if (this.audioProofSettings.ultrasonicFilter) {
        this.ultrasonicFilterNode.frequency.setValueAtTime(18500, now);
      } else {
        this.ultrasonicFilterNode.frequency.setValueAtTime(22050, now);
      }
    }

    // 5. Night / Ear Comfort Filter
    if (this.nightModeFilter) {
      if (this.audioProofSettings.nightMode || this.audioProofSettings.comfortMode === 'night_mode') {
        this.nightModeFilter.gain.setValueAtTime(-3.5, now); // Soft roll-off of piercing highs
      } else {
        this.nightModeFilter.gain.setValueAtTime(0, now);
      }
    }
  }

  /**
   * Set specific Comfort Mode presets
   */
  public setComfortMode(mode: ComfortMode) {
    let updates: Partial<AudioProofSettings> = { comfortMode: mode };
    switch (mode) {
      case 'safe_master':
        updates = {
          comfortMode: 'safe_master',
          limiterEnabled: true,
          ceilingDb: -1.5,
          limiterThreshold: -12,
          autoGainControl: true,
          antiHarshDeEsser: true,
          ultrasonicFilter: true,
          softSaturation: true,
          nightMode: false,
          earFatigueGuard: true,
        };
        break;
      case 'night_mode':
        updates = {
          comfortMode: 'night_mode',
          limiterEnabled: true,
          ceilingDb: -3.0,
          limiterThreshold: -18,
          autoGainControl: true,
          antiHarshDeEsser: true,
          ultrasonicFilter: true,
          softSaturation: true,
          nightMode: true,
          earFatigueGuard: true,
        };
        break;
      case 'anti_harsh':
        updates = {
          comfortMode: 'anti_harsh',
          limiterEnabled: true,
          ceilingDb: -1.5,
          limiterThreshold: -14,
          autoGainControl: true,
          antiHarshDeEsser: true,
          ultrasonicFilter: true,
          softSaturation: true,
          nightMode: false,
          earFatigueGuard: true,
        };
        break;
      case 'auto_normalize':
        updates = {
          comfortMode: 'auto_normalize',
          limiterEnabled: true,
          ceilingDb: -1.0,
          limiterThreshold: -10,
          autoGainControl: true,
          antiHarshDeEsser: true,
          ultrasonicFilter: true,
          softSaturation: true,
          nightMode: false,
          earFatigueGuard: true,
        };
        break;
      case 'bass_protect':
        updates = {
          comfortMode: 'bass_protect',
          limiterEnabled: true,
          ceilingDb: -2.0,
          limiterThreshold: -15,
          autoGainControl: true,
          antiHarshDeEsser: false,
          ultrasonicFilter: true,
          softSaturation: true,
          nightMode: false,
          earFatigueGuard: true,
        };
        break;
    }
    this.setAudioProofSettings(updates);
  }

  public async playTrack(track: Track) {
    this.init();
    if (this.audioCtx?.state === 'suspended') {
      await this.audioCtx.resume();
    }

    this.stopCurrent();
    this.currentTrack = track;
    this.isPlaying = true;
    this.currentTime = 0;
    this.duration = track.duration || 0;

    if (track.type === 'radio') {
      this.playRadioTuningSound();
    }

    if (this.audioElement) {
      if (track.file) {
        const fileUrl = URL.createObjectURL(track.file);
        this.audioElement.src = fileUrl;
      } else if (track.streamUrl) {
        this.audioElement.src = track.streamUrl;
      } else if (track.audioUrl) {
        this.audioElement.src = track.audioUrl;
      }
      this.audioElement.currentTime = 0;

      // Soft ramp-up on start to eliminate speaker pop / crackle
      if (this.inputGainNode && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        this.inputGainNode.gain.cancelScheduledValues(now);
        this.inputGainNode.gain.setValueAtTime(0.01, now);
        this.inputGainNode.gain.linearRampToValueAtTime(1.0, now + 0.12);
      }

      try {
        await this.audioElement.play();
      } catch (err) {
        console.warn('Audio playback error:', err);
      }
    }
  }

  public playRadioTuningSound() {
    if (!this.audioCtx || !this.masterGain) return;
    try {
      const now = this.audioCtx.currentTime;
      const bufferSize = this.audioCtx.sampleRate * 0.18;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noiseNode = this.audioCtx.createBufferSource();
      noiseNode.buffer = buffer;

      const bandpass = this.audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, now);
      bandpass.frequency.exponentialRampToValueAtTime(3200, now + 0.15);
      bandpass.Q.value = 2.5;

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.12, now); // Gentle, comfortable tuning noise level
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.exponentialRampToValueAtTime(1850, now + 0.12);

      const oscGain = this.audioCtx.createGain();
      oscGain.gain.setValueAtTime(0.02, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      noiseNode.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);

      noiseNode.start(now);
      noiseNode.stop(now + 0.18);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // AudioContext state check safe catch
    }
  }

  public togglePlay() {
    if (!this.currentTrack) return;
    this.init();

    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  public pause() {
    this.isPlaying = false;
    if (this.audioElement && !this.audioElement.paused) {
      if (this.inputGainNode && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        this.inputGainNode.gain.cancelScheduledValues(now);
        this.inputGainNode.gain.linearRampToValueAtTime(0.01, now + 0.06);
        setTimeout(() => {
          if (this.audioElement) this.audioElement.pause();
        }, 60);
      } else {
        this.audioElement.pause();
      }
    }
  }

  public resume() {
    if (!this.currentTrack) return;
    this.init();
    this.isPlaying = true;
    if (this.audioElement) {
      if (this.inputGainNode && this.audioCtx) {
        const now = this.audioCtx.currentTime;
        this.inputGainNode.gain.cancelScheduledValues(now);
        this.inputGainNode.gain.setValueAtTime(0.01, now);
        this.inputGainNode.gain.linearRampToValueAtTime(1.0, now + 0.08);
      }
      this.audioElement.play().catch((err) => console.warn('Resume failed:', err));
    }
  }

  public seek(targetSeconds: number) {
    this.currentTime = targetSeconds;
    if (this.audioElement && this.currentTrack?.type === 'file') {
      this.audioElement.currentTime = targetSeconds;
    }
  }

  public stopCurrent() {
    this.isPlaying = false;
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  public async toggleMicrophone(): Promise<boolean> {
    this.init();
    if (!this.microphone) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        this.microphone = this.audioCtx!.createMediaStreamSource(stream);
        if (this.inputGainNode) {
          this.microphone.connect(this.inputGainNode);
        }
        return true;
      } catch (err) {
        console.error('Microphone access error', err);
        return false;
      }
    } else {
      this.microphone.disconnect();
      this.microphone = null;
      return false;
    }
  }

  public getAudioStreamTracks(): MediaStreamTrack[] {
    if (this.mediaStreamDest) {
      return this.mediaStreamDest.stream.getAudioTracks();
    }
    return [];
  }

  /**
   * Real-time Multi-Band Energy & Transient Beat Detection
   */
  public analyze(): AudioAnalysis {
    const analysis: AudioAnalysis = {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      high: 0,
      treble: 0,
      overallAmp: 0,
      isBeat: false,
      beatIntensity: 0,
      energyHistory: this.energyHistory,
    };

    if (!this.analyser || !this.freqData || !this.timeData) {
      return analysis;
    }

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const binCount = this.analyser.frequencyBinCount;
    const sampleRate = this.audioCtx ? this.audioCtx.sampleRate : 44100;
    const hzPerBin = sampleRate / 2 / binCount;

    const getAverageInRange = (startHz: number, endHz: number) => {
      const startBin = Math.max(0, Math.floor(startHz / hzPerBin));
      const endBin = Math.min(binCount - 1, Math.ceil(endHz / hzPerBin));
      let sum = 0;
      let count = 0;
      for (let i = startBin; i <= endBin; i++) {
        sum += this.freqData![i];
        count++;
      }
      return count > 0 ? sum / count / 255 : 0;
    };

    analysis.subBass = getAverageInRange(20, 60);
    analysis.bass = getAverageInRange(60, 250);
    analysis.lowMid = getAverageInRange(250, 500);
    analysis.mid = getAverageInRange(500, 2000);
    analysis.high = getAverageInRange(2000, 6000);
    analysis.treble = getAverageInRange(6000, 16000);

    let totalSum = 0;
    for (let i = 0; i < binCount; i++) {
      totalSum += this.freqData[i];
    }
    analysis.overallAmp = totalSum / binCount / 255;

    // Transient Kick / Beat Detection
    const currentKickEnergy = analysis.subBass * 1.5 + analysis.bass * 1.2;

    if (currentKickEnergy > this.beatCutoff && currentKickEnergy > 0.3) {
      analysis.isBeat = true;
      analysis.beatIntensity = Math.min(1.0, (currentKickEnergy - this.beatCutoff) * 2 + 0.4);
      this.beatCutoff = currentKickEnergy * 1.15;
    } else {
      analysis.isBeat = false;
      this.beatCutoff *= this.beatDecayRate;
      this.beatCutoff = Math.max(this.beatCutoff, 0.25);
    }

    this.energyHistory.push(analysis.overallAmp);
    if (this.energyHistory.length > 64) {
      this.energyHistory.shift();
    }

    // Dynamic AGC (Auto-Gain Control) Background Leveling
    if (this.audioProofSettings.autoGainControl && this.agcGainNode && this.audioCtx && this.isPlaying) {
      // Calculate RMS from time domain
      let sumSquares = 0;
      for (let i = 0; i < this.timeData.length; i++) {
        const norm = (this.timeData[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rms = Math.sqrt(sumSquares / this.timeData.length);
      this.lastRmsValue = this.lastRmsValue * 0.9 + rms * 0.1;

      // Desired RMS around 0.22 (comfort zone)
      if (this.lastRmsValue > 0.38) {
        // Audio is too loud / hot, smoothly compress gain
        this.agcTargetGain = Math.max(0.65, 0.22 / this.lastRmsValue);
      } else if (this.lastRmsValue < 0.10 && this.lastRmsValue > 0.01) {
        // Audio is quiet, gently boost without exceeding safety ceiling
        this.agcTargetGain = Math.min(1.35, 0.20 / Math.max(this.lastRmsValue, 0.05));
      } else {
        this.agcTargetGain = 1.0;
      }

      this.currentAgcGain += (this.agcTargetGain - this.currentAgcGain) * 0.05;
      const now = this.audioCtx.currentTime;
      this.agcGainNode.gain.setValueAtTime(this.currentAgcGain, now);
    }

    return analysis;
  }

  /**
   * Real-time Audio Proofing & Safety Metering
   */
  public getAudioProofMetrics(): AudioProofMetrics {
    let peak = 0;
    let sumSquares = 0;

    if (this.timeData) {
      this.analyser?.getByteTimeDomainData(this.timeData);
      for (let i = 0; i < this.timeData.length; i++) {
        const val = Math.abs((this.timeData[i] - 128) / 128);
        if (val > peak) peak = val;
        sumSquares += val * val;
      }
    }

    const peakDb = peak > 0.0001 ? 20 * Math.log10(peak) : -96;
    const rms = Math.sqrt(sumSquares / (this.timeData?.length || 1));
    const rmsDb = rms > 0.0001 ? 20 * Math.log10(rms) : -96;

    // Gain reduction from dynamics limiter
    const gr = this.dynamicsCompressor?.reduction || 0; // Negative number in dB
    const limiterGr = this.brickwallLimiter?.reduction || 0;
    const totalGr = Math.abs(gr) + Math.abs(limiterGr);

    const isPeakGuarded = totalGr > 0.5 || peakDb > -2.0;

    if (peakDb > -0.5 || totalGr > 3.0) {
      this.clippingPreventedCount++;
    }

    let status: AudioProofMetrics['status'] = 'optimal';
    if (totalGr > 4.0) {
      status = 'clipping_prevented';
    } else if (totalGr > 1.0) {
      status = 'limiting';
    } else if (isPeakGuarded) {
      status = 'guarded';
    }

    return {
      peakDb: Math.min(0, Math.round(peakDb * 10) / 10),
      gainReductionDb: Math.round(totalGr * 10) / 10,
      rmsDb: Math.round(rmsDb * 10) / 10,
      isPeakGuarded,
      clippingPrevented: this.clippingPreventedCount,
      status,
    };
  }

  public getTimeDomainData(buffer: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteTimeDomainData(buffer);
    }
  }

  public getFrequencyData(buffer: Uint8Array): void {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(buffer);
    }
  }
}

export const audioEngine = AudioEngine.getInstance();
