import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlasmaCanvas } from './components/PlasmaCanvas';
import { PlayerDock } from './components/PlayerDock';
import { PlaylistDrawer } from './components/PlaylistDrawer';
import { EqualizerModal } from './components/EqualizerModal';
import { VisualizerSettings } from './components/VisualizerSettings';
import { VideoStudioModal } from './components/VideoStudioModal';
import { SovereignIspModal } from './components/SovereignIspModal';
import { DonateModal } from './components/DonateModal';
import { CaptureOverlay } from './components/CaptureOverlay';
import { StaticBackgroundLayer } from './components/StaticBackgroundLayer';
import { TvVisualizerOverlay } from './components/TvVisualizerOverlay';
import { audioEngine, DEFAULT_AUDIO_PROOF } from './audio/AudioEngine';
import { CanvasVideoRecorder, takeCanvasSnapshot, toggleFullscreen } from './utils/capture';
import { RADIO_STATIONS, stationToTrack } from './data/radioStations';
import { SYNTHWAVE_BACKGROUNDS } from './data/backgrounds';
import {
  Track,
  VisualizerParams,
  VisualizerMode,
  ColorTheme,
  EqualizerSettings,
  CaptureSettings,
  BackgroundSettings,
  TvVisualizerSettings,
} from './types';
import { Camera, Film, Music, CheckCircle2, Radio, Sparkles } from 'lucide-react';

const INITIAL_RADIO_TRACKS: Track[] = RADIO_STATIONS.map((s) => stationToTrack(s));

const INITIAL_PARAMS: VisualizerParams = {
  mode: 'plasma_orb',
  theme: 'cyberpunk',
  arcs: 16,
  complexity: 6,
  displacement: 45,
  width: 2.2,
  glow: 28,
  speed: 1.0,
  particleCount: 80,
  shockwaveIntensity: 1.4,
  beatFlash: true,
  emfSpiral: true,
  cameraShake: false,
  bassReactivity: 1.8,
  highReactivity: 1.2,
  customHue: 190,
  autoRandomize: true,
  autoRandomizeInterval: 2500, // Very fast randomization
};

const INITIAL_BACKGROUND: BackgroundSettings = {
  enabled: true,
  selectedId: 'plasma_peaks',
  opacity: 0.65,
  blur: 3,
  brightness: 0.9,
  audioPulse: true,
  vignette: true,
  scanlines: true,
};

const INITIAL_TV_SETTINGS: TvVisualizerSettings = {
  enabled: false,
  chassis: 'retro_woodgrain',
  aspectRatio: '4:3',
  curvature: true,
  scanlineIntensity: 0.65,
  phosphorGlow: true,
  screenFlicker: true,
  showOsd: true,
  staticBurstOnChange: true,
  rgbShift: true,
  glitchNoise: 0.2,
  channelIndex: 1,
};

const INITIAL_EQ: EqualizerSettings = {
  subBass: 6,
  bass: 4,
  mid: 1,
  high: 3,
  treble: 5,
  bassBoost: 4,
  stereoWidth: 1.2,
  dynamicsLimiter: true,
  presetName: 'Plasma Punch',
  audioProof: DEFAULT_AUDIO_PROOF,
};

const INITIAL_CAPTURE: CaptureSettings = {
  imageFormat: 'png',
  imageQuality: 0.95,
  videoBitrate: 15000000,
  videoFps: 60,
  videoResolution: '1080p',
  aspectRatio: '16:9',
  timerMode: 'manual',
  includeAudio: true,
  watermark: {
    showTitleCard: true,
    showSpectrumOverlay: false,
    customWatermark: 'D9 Plasma Player',
    showTimestamp: true,
  },
};

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_RADIO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(INITIAL_RADIO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

  // Modals and Drawers
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isSovereignOpen, setIsSovereignOpen] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  // Settings
  const [params, setParams] = useState<VisualizerParams>(INITIAL_PARAMS);
  const [background, setBackground] = useState<BackgroundSettings>(INITIAL_BACKGROUND);
  const [tvSettings, setTvSettings] = useState<TvVisualizerSettings>(INITIAL_TV_SETTINGS);
  const [eqSettings, setEqSettings] = useState<EqualizerSettings>(INITIAL_EQ);
  const [captureSettings, setCaptureSettings] = useState<CaptureSettings>(INITIAL_CAPTURE);

  // Status
  const [micActive, setMicActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [uiVisible, setUiVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; icon: string } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recorderRef = useRef<CanvasVideoRecorder | null>(null);

  const showToast = useCallback((text: string, icon: string = 'check') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, icon });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Track Playback Handlers
  const handlePlayTrack = useCallback(
    async (track: Track) => {
      try {
        await audioEngine.playTrack(track);
        setCurrentTrack(track);
        setIsPlaying(true);
        if (track.type === 'radio') {
          showToast(`Tuning Radio: ${track.title} (${track.frequency || 'Live'})`, 'music');
        } else {
          showToast(`Now Playing: ${track.title}`, 'music');
        }
      } catch (err) {
        console.error('Failed to play track:', err);
      }
    },
    [showToast]
  );

  const handleTogglePlay = useCallback(async () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        handlePlayTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      await audioEngine.resume();
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, tracks, handlePlayTrack]);

  const currentTrackIndex = tracks.findIndex((t) => t.id === currentTrack?.id);

  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;
    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    handlePlayTrack(tracks[nextIndex]);
  }, [tracks, currentTrackIndex, isShuffle, handlePlayTrack]);

  const handlePrevTrack = useCallback(() => {
    if (tracks.length === 0) return;
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = tracks.length - 1;
    }
    handlePlayTrack(tracks[prevIndex]);
  }, [tracks, currentTrackIndex, handlePlayTrack]);

  const handleCycleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const handleToggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const handleAddTracks = useCallback(
    (newTracks: Track[]) => {
      setTracks((prev) => [...newTracks, ...prev]);
      showToast(`Added ${newTracks.length} track(s) to library`, 'music');
    },
    [showToast]
  );

  const handleRemoveTrack = useCallback((trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  // TV Toggle Handler
  const handleToggleTv = useCallback(() => {
    setTvSettings((prev) => {
      const nextEnabled = !prev.enabled;
      showToast(
        nextEnabled ? 'Retro TV CRT Visualizer Activated' : 'TV Mode Deactivated',
        'check'
      );
      return { ...prev, enabled: nextEnabled };
    });
  }, [showToast]);

  // Background Cycling Handler
  const handleCycleBackground = useCallback(() => {
    const list = ['none', ...SYNTHWAVE_BACKGROUNDS.map((b) => b.id)];
    const currentIndex = list.indexOf(background.enabled ? background.selectedId : 'none');
    const nextIndex = (currentIndex + 1) % list.length;
    const nextId = list[nextIndex];

    if (nextId === 'none') {
      setBackground((prev) => ({ ...prev, enabled: false, selectedId: 'none' }));
      showToast('Backdrop: Deep Cosmic Void', 'check');
    } else {
      const found = SYNTHWAVE_BACKGROUNDS.find((b) => b.id === nextId);
      if (found) {
        setBackground((prev) => ({ ...prev, enabled: true, selectedId: nextId }));
        setParams((prev) => ({ ...prev, theme: found.themeMatch }));
        showToast(`Backdrop: ${found.name} (${found.themeMatch})`, 'check');
      }
    }
  }, [background, showToast]);

  // Fast Automatic Randomizer Loop
  useEffect(() => {
    if (!params.autoRandomize) return;

    const VALID_MODES: VisualizerMode[] = ['plasma_orb', 'radial_spectrum', 'cosmic_nebula', 'lightning_matrix', 'vector_ribbon'];
    const VALID_THEMES: ColorTheme[] = ['cyberpunk', 'solar_flare', 'cosmic_violet', 'bio_emerald', 'hyper_prism', 'cryo_glacial', 'obsidian_lava'];

    const interval = setInterval(() => {
      setParams((prev) => ({
        ...prev,
        mode: VALID_MODES[Math.floor(Math.random() * VALID_MODES.length)],
        theme: VALID_THEMES[Math.floor(Math.random() * VALID_THEMES.length)],
        arcs: Math.floor(Math.random() * 24) + 4, // 4 to 28
        complexity: Math.floor(Math.random() * 8) + 2, // 2 to 10
        // Increase variety and allow MUCH slower speeds (0.05 to 2.05)
        speed: Math.random() * 2.0 + 0.05,
        particleCount: Math.floor(Math.random() * 120) + 20, // 20 to 140
        shockwaveIntensity: Math.random() * 1.5 + 0.5, // 0.5 to 2.0
      }));
    }, params.autoRandomizeInterval || 2500);

    return () => clearInterval(interval);
  }, [params.autoRandomize, params.autoRandomizeInterval]);

  // Set up Audio Engine Callbacks & Recorder
  useEffect(() => {
    audioEngine.setEqualizer(eqSettings);

    audioEngine.setCallbacks(
      // On track ended
      () => {
        if (captureSettings.timerMode === 'track_end' && recorderRef.current?.isRecording) {
          recorderRef.current.stop();
        }

        if (repeatMode === 'one' && currentTrack) {
          handlePlayTrack(currentTrack);
        } else if (repeatMode === 'all') {
          handleNextTrack();
        } else {
          setIsPlaying(false);
        }
      }
    );

    recorderRef.current = new CanvasVideoRecorder(
      (seconds) => setRecordSeconds(seconds),
      (recording) => {
        setIsRecording(recording);
        if (!recording) {
          showToast('Video recording saved with high-bitrate audio', 'film');
        }
      }
    );

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (recorderRef.current?.isRecording) {
        recorderRef.current.stop();
      }
    };
  }, [
    eqSettings,
    repeatMode,
    currentTrack,
    captureSettings.timerMode,
    handlePlayTrack,
    handleNextTrack,
    showToast,
  ]);

  // Mic Toggle
  const handleToggleMic = useCallback(async () => {
    const active = await audioEngine.toggleMicrophone();
    setMicActive(active);
    showToast(
      active ? 'Microphone audio reactivity active' : 'Microphone deactivated',
      'check'
    );
  }, [showToast]);

  // Snapshot & Record Handlers
  const handleTakeSnapshot = useCallback(() => {
    if (!canvasRef.current) return;
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 200);

    takeCanvasSnapshot(
      canvasRef.current,
      captureSettings.imageFormat,
      captureSettings.imageQuality,
      {
        title: currentTrack?.title,
        artist: currentTrack?.artist,
        customWatermark: captureSettings.watermark?.customWatermark,
      }
    );
    showToast(`Snapshot captured (${captureSettings.imageFormat.toUpperCase()})`, 'camera');
  }, [captureSettings, currentTrack, showToast]);

  const handleToggleRecord = useCallback(() => {
    if (!canvasRef.current || !recorderRef.current) return;

    if (recorderRef.current.isRecording) {
      recorderRef.current.stop();
    } else {
      let maxDuration: number | undefined = undefined;
      if (captureSettings.timerMode === '15s') maxDuration = 15;
      else if (captureSettings.timerMode === '30s') maxDuration = 30;
      else if (captureSettings.timerMode === '60s') maxDuration = 60;
      else if (captureSettings.timerMode === '180s') maxDuration = 180;

      const started = recorderRef.current.start(canvasRef.current, {
        fps: captureSettings.videoFps,
        bitrate: captureSettings.videoBitrate,
        includeAudio: captureSettings.includeAudio,
        maxDurationSeconds: maxDuration,
        aspectRatio: captureSettings.aspectRatio,
        watermark: captureSettings.watermark,
        trackTitle: currentTrack?.title,
        trackArtist: currentTrack?.artist,
      });

      if (started) {
        setRecordSeconds(0);
        showToast(
          `Recording 60FPS video with synced audio ${
            maxDuration ? `(${maxDuration}s timer)` : ''
          }`,
          'film'
        );
      }
    }
  }, [captureSettings, currentTrack, showToast]);

  const handleToggleFullscreen = useCallback(() => {
    toggleFullscreen();
  }, []);

  const handleToggleUi = useCallback(() => {
    setUiVisible((prev) => !prev);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (key === 'v') {
        e.preventDefault();
        setIsStudioOpen((prev) => !prev);
      } else if (key === 'j') {
        e.preventDefault();
        setIsSovereignOpen((prev) => !prev);
      } else if (key === 'd') {
        e.preventDefault();
        setIsDonateOpen((prev) => !prev);
      } else if (key === 'e') {
        e.preventDefault();
        setIsEqualizerOpen((prev) => !prev);
      } else if (key === 'l') {
        e.preventDefault();
        setIsPlaylistOpen((prev) => !prev);
      } else if (key === 't') {
        e.preventDefault();
        handleToggleTv();
      } else if (key === 'c') {
        e.preventDefault();
        handleNextTrack();
      } else if (key === 'b') {
        e.preventDefault();
        handleCycleBackground();
      } else if (key === 's') {
        e.preventDefault();
        handleTakeSnapshot();
      } else if (key === 'r') {
        e.preventDefault();
        handleToggleRecord();
      } else if (key === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (key === 'h') {
        e.preventDefault();
        handleToggleUi();
      } else if (key === 'arrowright') {
        e.preventDefault();
        handleNextTrack();
      } else if (key === 'arrowleft') {
        e.preventDefault();
        handlePrevTrack();
      } else if (key === 'm') {
        e.preventDefault();
        const isMuted = audioEngine.toggleMute();
        showToast(isMuted ? 'Muted' : 'Unmuted', 'music');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleTogglePlay,
    handleToggleTv,
    handleCycleBackground,
    handleTakeSnapshot,
    handleToggleRecord,
    handleToggleFullscreen,
    handleToggleUi,
    handleNextTrack,
    handlePrevTrack,
    showToast,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020204] text-white font-sans select-none">
      {/* Ethereal Synthwave Landscape Static Background Layer */}
      <StaticBackgroundLayer background={background} />

      {/* Visualizer Fullscreen Canvas */}
      <PlasmaCanvas ref={canvasRef} params={params} background={background} />

      {/* Retro TV CRT Overlay Frame (When enabled) */}
      <TvVisualizerOverlay
        settings={tvSettings}
        setSettings={setTvSettings}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onNextChannel={handleNextTrack}
        onPrevChannel={handlePrevTrack}
        channelIndex={currentTrackIndex + 1}
      />

      {/* Snapshot Visual Flash Effect */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 bg-white transition-opacity duration-200 ${
          flashActive ? 'opacity-75' : 'opacity-0'
        }`}
      />

      {/* Top Floating Capture & Quick Action Bar */}
      <CaptureOverlay
        isRecording={isRecording}
        recordSeconds={recordSeconds}
        uiVisible={uiVisible}
        isFullscreen={isFullscreen}
        captureSettings={captureSettings}
        tvEnabled={tvSettings.enabled}
        onTakeSnapshot={handleTakeSnapshot}
        onToggleRecord={handleToggleRecord}
        onOpenStudio={() => setIsStudioOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleUi={handleToggleUi}
        onCycleBackground={handleCycleBackground}
        onToggleTv={handleToggleTv}
        onOpenRadio={() => setIsPlaylistOpen(true)}
        onOpenSovereign={() => setIsSovereignOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
      />

      {/* Floating Audiophile Music & Radio Player Dock */}
      {uiVisible && (
        <PlayerDock
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onPrevTrack={handlePrevTrack}
          onNextTrack={handleNextTrack}
          isShuffle={isShuffle}
          onToggleShuffle={handleToggleShuffle}
          repeatMode={repeatMode}
          onCycleRepeat={handleCycleRepeat}
          onOpenPlaylist={() => setIsPlaylistOpen(true)}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          onOpenVisualizerSettings={() => setIsVisualizerOpen(true)}
          onOpenStudio={() => setIsStudioOpen(true)}
          onOpenSovereign={() => setIsSovereignOpen(true)}
          onOpenDonate={() => setIsDonateOpen(true)}
          isPlaylistOpen={isPlaylistOpen}
          isEqualizerOpen={isEqualizerOpen}
          isVisualizerOpen={isVisualizerOpen}
          isStudioOpen={isStudioOpen}
          isSovereignOpen={isSovereignOpen}
          isDonateOpen={isDonateOpen}
          micActive={micActive}
          onToggleMic={handleToggleMic}
          params={params}
          tvSettings={tvSettings}
          onToggleTv={handleToggleTv}
        />
      )}

      {/* Radio Tuner & Music Library Drawer */}
      <PlaylistDrawer
        isOpen={isPlaylistOpen && uiVisible}
        onClose={() => setIsPlaylistOpen(false)}
        tracks={tracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onSelectTrack={handlePlayTrack}
        onAddTracks={handleAddTracks}
        onRemoveTrack={handleRemoveTrack}
        onOpenSovereign={() => setIsSovereignOpen(true)}
        onOpenDonate={() => setIsDonateOpen(true)}
      />

      {/* 5-Band Studio Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen && uiVisible}
        onClose={() => setIsEqualizerOpen(false)}
        eqSettings={eqSettings}
        onUpdateEq={setEqSettings}
      />

      {/* Sovereign.ISP Decentralized Internet Mesh Modal */}
      <SovereignIspModal
        isOpen={isSovereignOpen && uiVisible}
        onClose={() => setIsSovereignOpen(false)}
      />

      {/* Support & Donate Modal */}
      <DonateModal
        isOpen={isDonateOpen && uiVisible}
        onClose={() => setIsDonateOpen(false)}
        onDonatedToast={(msg) => showToast(msg, 'check')}
      />

      {/* Video Generator & 60FPS Recorder Studio Modal */}
      <VideoStudioModal
        isOpen={isStudioOpen && uiVisible}
        onClose={() => setIsStudioOpen(false)}
        captureSettings={captureSettings}
        setCaptureSettings={setCaptureSettings}
        isRecording={isRecording}
        recordSeconds={recordSeconds}
        onToggleRecord={handleToggleRecord}
        onTakeSnapshot={handleTakeSnapshot}
        currentTrackTitle={currentTrack?.title}
      />

      {/* Visualizer Graphics Engine, Retro TV & Synthwave Backdrop Settings */}
      <VisualizerSettings
        isOpen={isVisualizerOpen && uiVisible}
        onClose={() => setIsVisualizerOpen(false)}
        params={params}
        setParams={setParams}
        background={background}
        setBackground={setBackground}
        tvSettings={tvSettings}
        setTvSettings={setTvSettings}
      />

      {/* Interactive Toast Notifications */}
      {toastMessage && (
        <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-xs font-medium text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200">
          {toastMessage.icon === 'camera' && <Camera className="h-4 w-4 text-indigo-400" />}
          {toastMessage.icon === 'film' && <Film className="h-4 w-4 text-rose-400" />}
          {toastMessage.icon === 'music' && <Music className="h-4 w-4 text-cyan-400" />}
          {toastMessage.icon === 'check' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
