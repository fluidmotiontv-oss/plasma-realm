import React, { useEffect, useState } from 'react';
import { EqualizerSettings, AudioProofSettings, ComfortMode, AudioProofMetrics } from '../types';
import { audioEngine, DEFAULT_AUDIO_PROOF } from '../audio/AudioEngine';
import {
  X,
  Sliders,
  RotateCcw,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Moon,
  VolumeX,
  Volume2,
  Ear,
  Radio,
  Sparkles,
  Gauge,
  Info,
} from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  eqSettings: EqualizerSettings;
  onUpdateEq: (settings: EqualizerSettings) => void;
}

const EQ_PRESETS: Record<
  string,
  Omit<EqualizerSettings, 'presetName' | 'audioProof'>
> = {
  'Plasma Punch': {
    subBass: 8,
    bass: 6,
    mid: 1,
    high: 4,
    treble: 7,
    bassBoost: 6,
    stereoWidth: 1.4,
    dynamicsLimiter: true,
  },
  'Bass Dominance': {
    subBass: 10,
    bass: 8,
    mid: -2,
    high: 2,
    treble: 3,
    bassBoost: 9,
    stereoWidth: 1.2,
    dynamicsLimiter: true,
  },
  'Electronic Club': {
    subBass: 7,
    bass: 5,
    mid: 2,
    high: 5,
    treble: 8,
    bassBoost: 5,
    stereoWidth: 1.5,
    dynamicsLimiter: true,
  },
  'Vocal Clarity': {
    subBass: -2,
    bass: 0,
    mid: 7,
    high: 5,
    treble: 4,
    bassBoost: 0,
    stereoWidth: 1.0,
    dynamicsLimiter: false,
  },
  'Acoustic Warmth': {
    subBass: 3,
    bass: 4,
    mid: 5,
    high: 2,
    treble: 3,
    bassBoost: 2,
    stereoWidth: 1.2,
    dynamicsLimiter: false,
  },
  'Rock & Metal': {
    subBass: 6,
    bass: 4,
    mid: -1,
    high: 6,
    treble: 7,
    bassBoost: 4,
    stereoWidth: 1.3,
    dynamicsLimiter: true,
  },
  'Studio Flat': {
    subBass: 0,
    bass: 0,
    mid: 0,
    high: 0,
    treble: 0,
    bassBoost: 0,
    stereoWidth: 1.0,
    dynamicsLimiter: false,
  },
};

const COMFORT_PRESETS: {
  id: ComfortMode;
  name: string;
  desc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'safe_master',
    name: 'Studio Safe Master',
    desc: 'High-fidelity brickwall limiter (-1.5dB true peak clamp) for pure audio without ear fatigue',
    badge: 'RECOMMENDED',
    icon: ShieldCheck,
  },
  {
    id: 'night_mode',
    name: 'Night Comfort / Whisper',
    desc: 'Heavy dynamic range compression + high-end softening. No sudden loud explosions or loud commercials',
    badge: 'NIGHT SAFE',
    icon: Moon,
  },
  {
    id: 'anti_harsh',
    name: 'Anti-Harsh Radio Tamer',
    desc: '6.5kHz de-esser & ultrasonic filter to remove sibilance and radio broadcast shrillness',
    badge: 'SMOOTH HIGHS',
    icon: Radio,
  },
  {
    id: 'auto_normalize',
    name: 'Auto-Loudness Normalizer',
    desc: 'Automatic Gain Control balances volume differences between quiet tracks & hot radio streams',
    badge: 'UNIFORM LEVEL',
    icon: Gauge,
  },
  {
    id: 'bass_protect',
    name: 'Bass Shield / Sub-Protect',
    desc: 'Punchy low frequencies with harmonic distortion ceiling to prevent headphone/speaker blowout',
    badge: 'SUB GUARD',
    icon: Zap,
  },
];

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  eqSettings,
  onUpdateEq,
}) => {
  const [activeTab, setActiveTab] = useState<'proof' | 'eq'>('proof');
  const [liveMeters, setLiveMeters] = useState<number[]>([10, 10, 10, 10, 10]);
  const [metrics, setMetrics] = useState<AudioProofMetrics>({
    peakDb: -96,
    gainReductionDb: 0,
    rmsDb: -96,
    isPeakGuarded: false,
    clippingPrevented: 0,
    status: 'optimal',
  });

  const proof = eqSettings.audioProof || audioEngine.audioProofSettings || DEFAULT_AUDIO_PROOF;

  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    const buffer = new Uint8Array(64);

    const updateLoop = () => {
      audioEngine.getFrequencyData(buffer);
      // Map to 5 bands: 60Hz, 250Hz, 1kHz, 4kHz, 12kHz
      const b1 = (buffer[1] || 0) / 255;
      const b2 = (buffer[4] || 0) / 255;
      const b3 = (buffer[14] || 0) / 255;
      const b4 = (buffer[32] || 0) / 255;
      const b5 = (buffer[56] || 0) / 255;
      setLiveMeters([
        Math.max(6, Math.floor(b1 * 100)),
        Math.max(6, Math.floor(b2 * 100)),
        Math.max(6, Math.floor(b3 * 100)),
        Math.max(6, Math.floor(b4 * 100)),
        Math.max(6, Math.floor(b5 * 100)),
      ]);

      const m = audioEngine.getAudioProofMetrics();
      setMetrics(m);

      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateProof = (updates: Partial<AudioProofSettings>) => {
    const nextProof = { ...proof, ...updates };
    const nextSettings: EqualizerSettings = {
      ...eqSettings,
      audioProof: nextProof,
      presetName: 'Custom',
    };
    onUpdateEq(nextSettings);
    audioEngine.setAudioProofSettings(nextProof);
  };

  const handleSelectComfortMode = (mode: ComfortMode) => {
    audioEngine.setComfortMode(mode);
    const nextSettings: EqualizerSettings = {
      ...eqSettings,
      audioProof: { ...audioEngine.audioProofSettings },
      presetName: 'Custom',
    };
    onUpdateEq(nextSettings);
  };

  const handleBandChange = (
    band: 'subBass' | 'bass' | 'mid' | 'high' | 'treble',
    val: number
  ) => {
    const nextSettings = {
      ...eqSettings,
      [band]: val,
      presetName: 'Custom',
    };
    onUpdateEq(nextSettings);
    audioEngine.setEqualizer(nextSettings);
  };

  const handleApplyPreset = (presetName: string) => {
    const preset = EQ_PRESETS[presetName];
    if (preset) {
      const nextSettings: EqualizerSettings = {
        ...preset,
        presetName,
        audioProof: eqSettings.audioProof,
      };
      onUpdateEq(nextSettings);
      audioEngine.setEqualizer(nextSettings);
    }
  };

  const handleBassBoostChange = (val: number) => {
    const nextSettings = {
      ...eqSettings,
      bassBoost: val,
      presetName: 'Custom',
    };
    onUpdateEq(nextSettings);
    audioEngine.setEqualizer(nextSettings);
  };

  const bands: {
    key: 'subBass' | 'bass' | 'mid' | 'high' | 'treble';
    label: string;
    freq: string;
  }[] = [
    { key: 'subBass', label: 'Sub-Bass', freq: '60 Hz' },
    { key: 'bass', label: 'Bass', freq: '250 Hz' },
    { key: 'mid', label: 'Midrange', freq: '1.0 kHz' },
    { key: 'high', label: 'Highs', freq: '4.0 kHz' },
    { key: 'treble', label: 'Treble Air', freq: '12 kHz' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="equalizer-modal"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-[#0c0c16]/95 p-5 sm:p-6 text-white shadow-2xl backdrop-blur-2xl custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Audio Proof & Master DSP</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ACTIVE GUARD
                </span>
              </div>
              <p className="text-xs text-white/60">
                True-peak brickwall limiting, auto-leveling & ear comfort DSP
              </p>
            </div>
          </div>
          <button
            id="close-equalizer-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Audio Proof Status & Meter Bar */}
        <div className="my-4 p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${
                metrics.gainReductionDb > 2 ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              }`} />
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Live Hearing Guard
              </span>
              <span className="text-[11px] text-white/70 font-mono">
                {metrics.status === 'optimal' && '• Peak Clean (Safe)'}
                {metrics.status === 'limiting' && '• Limiting Active (Taming Peak)'}
                {metrics.status === 'guarded' && '• Ear Guard Protection Active'}
                {metrics.status === 'clipping_prevented' && '• Loud Transient Prevented'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
              Peak: {metrics.peakDb > -90 ? `${metrics.peakDb} dBFS` : '-∞'}
            </span>
          </div>

          {/* Gain Reduction (GR) Meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/60 font-mono">
              <span>Limiter Attenuation (GR)</span>
              <span className={metrics.gainReductionDb > 0.5 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {metrics.gainReductionDb > 0 ? `-${metrics.gainReductionDb} dB reduction` : '0.0 dB (Transparent)'}
              </span>
            </div>
            <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden flex border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-75"
                style={{ width: `${Math.min(100, metrics.gainReductionDb * 12)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-4 gap-2">
          <button
            id="tab-audio-proof-btn"
            onClick={() => setActiveTab('proof')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'proof'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Audio Proof & Comfort Modes
          </button>
          <button
            id="tab-5band-eq-btn"
            onClick={() => setActiveTab('eq')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'eq'
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Sliders className="h-4 w-4" />
            5-Band EQ & Tone
          </button>
        </div>

        {activeTab === 'proof' ? (
          <div className="space-y-4">
            {/* Hearing Comfort Profiles */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2 flex items-center justify-between">
                <span>Hearing Comfort Profiles</span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  Mode: {proof.comfortMode.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMFORT_PRESETS.map((p) => {
                  const isSelected = proof.comfortMode === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectComfortMode(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 font-semibold text-xs text-white">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-white/60'}`} />
                          {p.name}
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed">{p.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Granular Audio Proofing Toggles */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Active Protection Chain
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Brickwall Limiter Toggle */}
                <div
                  onClick={() => handleUpdateProof({ limiterEnabled: !proof.limiterEnabled })}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                    proof.limiterEnabled ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-white">Brickwall True-Peak Limiter</div>
                    <div className="text-[10px] text-white/50">Clamps at {proof.ceilingDb} dBFS</div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${proof.limiterEnabled ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-white/20'}`} />
                </div>

                {/* Auto-Gain Normalizer (AGC) */}
                <div
                  onClick={() => handleUpdateProof({ autoGainControl: !proof.autoGainControl })}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                    proof.autoGainControl ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-white">Auto-Gain Control (AGC)</div>
                    <div className="text-[10px] text-white/50">Levels sudden loud/quiet station jumps</div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${proof.autoGainControl ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-white/20'}`} />
                </div>

                {/* Anti-Harsh De-Esser */}
                <div
                  onClick={() => handleUpdateProof({ antiHarshDeEsser: !proof.antiHarshDeEsser })}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                    proof.antiHarshDeEsser ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-white">Anti-Harsh De-Esser</div>
                    <div className="text-[10px] text-white/50">Tames 6.5kHz ear-piercing sibilance</div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${proof.antiHarshDeEsser ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-white/20'}`} />
                </div>

                {/* Soft Analog Saturator */}
                <div
                  onClick={() => handleUpdateProof({ softSaturation: !proof.softSaturation })}
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition ${
                    proof.softSaturation ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium text-white">Soft-Knee Waveshaper</div>
                    <div className="text-[10px] text-white/50">Rounds harsh digital square waves</div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${proof.softSaturation ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-white/20'}`} />
                </div>
              </div>

              {/* Ceiling & Sensitivity Sliders */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-white mb-1">
                    <span>True-Peak Ceiling</span>
                    <span className="font-mono text-emerald-400">{proof.ceilingDb} dBFS</span>
                  </div>
                  <input
                    type="range"
                    min="-4.0"
                    max="-0.5"
                    step="0.5"
                    value={proof.ceilingDb}
                    onChange={(e) => handleUpdateProof({ ceilingDb: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-white mb-1">
                    <span>Limiter Threshold</span>
                    <span className="font-mono text-emerald-400">{proof.limiterThreshold} dBFS</span>
                  </div>
                  <input
                    type="range"
                    min="-24"
                    max="-6"
                    step="1"
                    value={proof.limiterThreshold}
                    onChange={(e) => handleUpdateProof({ limiterThreshold: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Acoustic Presets */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 flex items-center justify-between">
                <span>Acoustic Mastering Presets</span>
                <span className="text-indigo-400 font-mono text-[11px]">
                  {eqSettings.presetName}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.keys(EQ_PRESETS).map((pName) => {
                  const isActive = eqSettings.presetName === pName;
                  return (
                    <button
                      key={pName}
                      onClick={() => handleApplyPreset(pName)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all text-center truncate ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-600 text-white shadow'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {pName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5-Band Vertical Equalizer with Live Meters */}
            <div className="rounded-xl border border-white/10 bg-black/50 p-4">
              <div className="grid grid-cols-5 gap-2 items-center text-center">
                {bands.map(({ key, label, freq }, idx) => {
                  const val = eqSettings[key];
                  const meterH = liveMeters[idx] || 10;
                  return (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <span className="text-[11px] font-mono font-medium text-indigo-300">
                        {val > 0 ? `+${val}` : val} dB
                      </span>

                      {/* Meter + Vertical Slider combo */}
                      <div className="relative h-32 flex items-center justify-center">
                        {/* Background live meter LED bar */}
                        <div className="absolute w-1.5 h-28 bg-white/5 rounded-full overflow-hidden flex flex-col justify-end">
                          <div
                            className="w-full bg-indigo-400/50 rounded-full transition-all duration-75"
                            style={{ height: `${meterH}%` }}
                          />
                        </div>

                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="0.5"
                          value={val}
                          onChange={(e) => handleBandChange(key, parseFloat(e.target.value))}
                          className="h-28 w-3 appearance-none bg-transparent rounded-lg cursor-pointer accent-indigo-400 [writing-mode:vertical-lr] [direction:rtl] z-10"
                        />
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-white">{label}</div>
                        <div className="text-[9px] font-mono text-white/40">{freq}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sub-Harmonic Bass Boost */}
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Sub-Harmonic Bass Boost
                </div>
                <span className="text-xs font-mono text-amber-300">
                  +{eqSettings.bassBoost ?? 3} dB
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={eqSettings.bassBoost ?? 3}
                onChange={(e) => handleBassBoostChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-white/40">
            Hardware-accelerated 64-bit Audio Proof & Limiter Chain
          </div>
          <button
            onClick={() => {
              handleApplyPreset('Studio Flat');
              handleSelectComfortMode('safe_master');
            }}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
