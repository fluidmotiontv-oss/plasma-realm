import React, { useState, useEffect, useRef } from 'react';
import { Track, VisualizerParams, TvVisualizerSettings } from '../types';
import { audioEngine } from '../audio/AudioEngine';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Sliders,
  ListMusic,
  Mic,
  MicOff,
  Radio,
  Tv,
  Film,
  Sparkles,
  Signal,
  Video,
  ShieldCheck,
  Network,
  Heart,
} from 'lucide-react';

interface PlayerDockProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevTrack: () => void;
  onNextTrack: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onCycleRepeat: () => void;
  onOpenPlaylist: () => void;
  onOpenEqualizer: () => void;
  onOpenVisualizerSettings: () => void;
  onOpenStudio?: () => void;
  onOpenSovereign?: () => void;
  onOpenDonate?: () => void;
  isPlaylistOpen: boolean;
  isEqualizerOpen: boolean;
  isVisualizerOpen: boolean;
  isStudioOpen?: boolean;
  isSovereignOpen?: boolean;
  isDonateOpen?: boolean;
  micActive: boolean;
  onToggleMic: () => void;
  params: VisualizerParams;
  tvSettings?: TvVisualizerSettings;
  onToggleTv?: () => void;
}

export const PlayerDock: React.FC<PlayerDockProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onPrevTrack,
  onNextTrack,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  onOpenPlaylist,
  onOpenEqualizer,
  onOpenVisualizerSettings,
  onOpenStudio,
  onOpenSovereign,
  onOpenDonate,
  isPlaylistOpen,
  isEqualizerOpen,
  isVisualizerOpen,
  isStudioOpen,
  isSovereignOpen,
  isDonateOpen,
  micActive,
  onToggleMic,
  params,
  tvSettings,
  onToggleTv,
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(240);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [spectrumBars, setSpectrumBars] = useState<number[]>([15, 25, 45, 60, 30, 20, 10, 5]);
  const [limiterReduction, setLimiterReduction] = useState(0);

  // Audio spectrum & time polling loop
  useEffect(() => {
    let animId: number;
    const tempBuffer = new Uint8Array(32);

    const updateLoop = () => {
      if (isPlaying) {
        if (currentTrack?.type === 'radio') {
          setCurrentTime((prev) => prev + 0.1);
          setDuration(0);
        } else {
          setCurrentTime(audioEngine.currentTime);
          setDuration(audioEngine.duration || currentTrack?.duration || 240);
        }

        audioEngine.getFrequencyData(tempBuffer);
        const bars: number[] = [];
        const step = Math.floor(tempBuffer.length / 8);
        for (let i = 0; i < 8; i++) {
          const val = tempBuffer[i * step] / 255;
          bars.push(Math.max(8, Math.min(100, Math.floor(val * 100))));
        }
        setSpectrumBars(bars);

        const metrics = audioEngine.getAudioProofMetrics();
        setLimiterReduction(metrics.gainReductionDb);
      } else {
        setSpectrumBars([8, 8, 8, 8, 8, 8, 8, 8]);
        setLimiterReduction(0);
      }
      animId = requestAnimationFrame(updateLoop);
    };

    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentTrack]);

  const formatTime = (secs: number) => {
    if (currentTrack?.type === 'radio') return 'LIVE';
    if (isNaN(secs) || secs === Infinity) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentTrack?.type === 'radio') return;
    const val = parseFloat(e.target.value);
    setSeekVal(val);
    setIsSeeking(true);
  };

  const handleSeekCommit = () => {
    if (currentTrack?.type === 'radio') return;
    setIsSeeking(false);
    audioEngine.seek(seekVal);
    setCurrentTime(seekVal);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(false);
    audioEngine.setVolume(val);
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  const currentDisplayTime = isSeeking ? seekVal : currentTime;
  const progressPercent =
    currentTrack?.type === 'radio'
      ? 100
      : duration > 0
      ? Math.min(100, (currentDisplayTime / duration) * 100)
      : 0;

  return (
    <div
      id="audiophile-player-dock"
      className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-4xl rounded-2xl border border-white/15 bg-black/80 p-3 sm:p-4 text-white shadow-2xl backdrop-blur-2xl transition-all duration-300"
    >
      {/* Top Track & Info Scrub Line */}
      <div className="flex items-center gap-3 mb-2 px-1">
        <span className="text-[11px] font-mono text-cyan-400/90 font-bold shrink-0">
          {formatTime(currentDisplayTime)}
        </span>

        {/* Scrub Bar / Live Stream Indicator */}
        <div className="relative flex-1 group">
          {currentTrack?.type === 'radio' ? (
            <div className="h-2 w-full bg-cyan-950/40 rounded-full overflow-hidden border border-cyan-500/20 flex items-center px-2">
              <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 rounded-full animate-pulse" />
            </div>
          ) : (
            <div className="relative h-2 w-full flex items-center">
              {/* Background Track */}
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <input
                type="range"
                min="0"
                max={duration || 240}
                step="0.5"
                value={currentDisplayTime}
                onChange={handleSeekChange}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>

        <span className="text-[11px] font-mono text-white/50 shrink-0">
          {currentTrack?.type === 'radio' ? (
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              ON AIR
            </span>
          ) : (
            formatTime(duration)
          )}
        </span>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Track Info & Mini Cover Art */}
        <div className="flex items-center gap-3 min-w-0 flex-1 max-w-xs sm:max-w-sm">
          {/* Animated Mini Cover Art / Spectrum Icon */}
          <div
            onClick={onOpenPlaylist}
            className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br ${
              currentTrack?.coverArt || 'from-indigo-600 via-purple-600 to-cyan-600'
            } flex items-center justify-center text-white shrink-0 shadow-lg cursor-pointer group hover:scale-105 transition-transform overflow-hidden relative border border-white/10`}
          >
            {/* Dynamic mini spectrum bars inside cover */}
            <div className="flex items-end gap-0.5 h-5 z-10">
              {spectrumBars.map((val, idx) => (
                <div
                  key={idx}
                  className="w-0.5 bg-white/90 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, val * 0.2)}px` }}
                />
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300">
                {currentTrack?.title || 'No Audio Selected'}
              </span>
              {currentTrack?.frequency && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden sm:inline">
                  {currentTrack.frequency}
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/50 truncate flex items-center gap-1.5">
              <span>{currentTrack?.artist || 'Select a live radio station or drop a file'}</span>
              {currentTrack?.bitrate && (
                <span className="text-[10px] text-cyan-400 font-mono">
                  • {currentTrack.bitrate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Shuffle Toggle */}
          <button
            onClick={onToggleShuffle}
            title={isShuffle ? 'Shuffle Active' : 'Shuffle Off'}
            className={`p-2 rounded-xl transition ${
              isShuffle
                ? 'text-cyan-400 bg-cyan-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Shuffle className="h-4 w-4" />
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevTrack}
            title="Previous Track / Station"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition active:scale-95"
          >
            <SkipBack className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
          </button>

          {/* Master Play / Pause Button */}
          <button
            id="master-play-pause-btn"
            onClick={onTogglePlay}
            title="Play / Pause (Space)"
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] transition active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
            ) : (
              <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNextTrack}
            title="Next Track / Station (C)"
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition active:scale-95"
          >
            <SkipForward className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
          </button>

          {/* Repeat Mode */}
          <button
            onClick={onCycleRepeat}
            title={`Repeat: ${repeatMode}`}
            className={`p-2 rounded-xl transition ${
              repeatMode !== 'off'
                ? 'text-indigo-400 bg-indigo-500/20'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="h-4 w-4" />
            ) : (
              <Repeat className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Right: Studio Video Generator, Equalizer, Mic, TV, Volume */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Studio Video Generator / Recorder Modal Trigger */}
          {onOpenStudio && (
            <button
              id="dock-open-studio-btn"
              onClick={onOpenStudio}
              title="Video Generator & 60FPS Recorder Studio (V)"
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                isStudioOpen
                  ? 'border-rose-500 bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white'
              }`}
            >
              <Film className="h-4 w-4" />
              <span className="text-xs font-bold hidden md:inline">Studio Video</span>
            </button>
          )}

          {/* 5-Band Studio Equalizer & Audio Proof DSP */}
          <button
            id="dock-open-eq-btn"
            onClick={onOpenEqualizer}
            title="Audio Proof Limiter & 5-Band Equalizer (E)"
            className={`px-2.5 py-2 rounded-xl transition flex items-center gap-1.5 border ${
              isEqualizerOpen
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : limiterReduction > 0.5
                ? 'border-amber-500/50 bg-amber-950/40 text-amber-300'
                : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/50 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold hidden xl:inline">
              {limiterReduction > 0.5 ? `-${limiterReduction}dB` : 'SAFE'}
            </span>
          </button>

          {/* Live World Radio & Library Drawer */}
          <button
            id="dock-open-playlist-btn"
            onClick={onOpenPlaylist}
            title="Radio Tuner & Audio Library (L)"
            className={`p-2 rounded-xl transition ${
              isPlaylistOpen
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Radio className="h-4 w-4 text-cyan-400" />
          </button>

          {/* Retro TV CRT Mode Toggle */}
          {onToggleTv && (
            <button
              id="dock-toggle-tv-btn"
              onClick={onToggleTv}
              title="Toggle Retro TV CRT Mode (T)"
              className={`p-2 rounded-xl transition ${
                tvSettings?.enabled
                  ? 'bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Tv className="h-4 w-4" />
            </button>
          )}

          {/* Microphone Audio Reactivity Toggle */}
          <button
            id="dock-toggle-mic-btn"
            onClick={onToggleMic}
            title={micActive ? 'Microphone Active' : 'Listen via Microphone'}
            className={`p-2 rounded-xl transition ${
              micActive
                ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          {/* Visualizer Settings Modal Trigger */}
          <button
            id="dock-open-visualizer-btn"
            onClick={onOpenVisualizerSettings}
            title="Visualizer Optics & Synthwave Backdrops"
            className={`p-2 rounded-xl transition ${
              isVisualizerOpen
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </button>

          {/* Join Sovereign.ISP Portal Link / Modal */}
          {onOpenSovereign && (
            <button
              id="dock-open-sovereign-btn"
              onClick={onOpenSovereign}
              title="Join Sovereign.ISP Decentralized Internet Mesh (J)"
              className={`p-2 rounded-xl border transition flex items-center gap-1 ${
                isSovereignOpen
                  ? 'border-cyan-400 bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 hover:text-white'
              }`}
            >
              <Network className="h-4 w-4" />
              <span className="text-[11px] font-bold hidden 2xl:inline">Sovereign.ISP</span>
            </button>
          )}

          {/* Support & Donate Button */}
          {onOpenDonate && (
            <button
              id="dock-open-donate-btn"
              onClick={onOpenDonate}
              title="Support & Donate to Project (D)"
              className={`p-2 rounded-xl border transition flex items-center gap-1 ${
                isDonateOpen
                  ? 'border-rose-400 bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  : 'border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 hover:text-white'
              }`}
            >
              <Heart className="h-4 w-4 fill-rose-500/30 text-rose-400" />
              <span className="text-[11px] font-bold hidden 2xl:inline">Donate</span>
            </button>
          )}

          {/* Volume Control */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-white/10">
            <button
              onClick={handleToggleMute}
              title="Mute / Unmute (M)"
              className="text-white/60 hover:text-white transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
