import React from 'react';
import {
  Camera,
  Video,
  Square,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Sparkles,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Tv,
  Radio,
  Film,
  Sliders,
  Network,
  Heart,
  ExternalLink,
} from 'lucide-react';
import { CaptureSettings } from '../types';

interface CaptureOverlayProps {
  isRecording: boolean;
  recordSeconds: number;
  uiVisible: boolean;
  isFullscreen: boolean;
  captureSettings: CaptureSettings;
  tvEnabled?: boolean;
  onTakeSnapshot: () => void;
  onToggleRecord: () => void;
  onOpenStudio: () => void;
  onToggleFullscreen: () => void;
  onToggleUi: () => void;
  onCycleBackground?: () => void;
  onToggleTv?: () => void;
  onOpenRadio?: () => void;
  onOpenSovereign?: () => void;
  onOpenDonate?: () => void;
}

export function CaptureOverlay({
  isRecording,
  recordSeconds,
  uiVisible,
  isFullscreen,
  captureSettings,
  tvEnabled = false,
  onTakeSnapshot,
  onToggleRecord,
  onOpenStudio,
  onToggleFullscreen,
  onToggleUi,
  onCycleBackground,
  onToggleTv,
  onOpenRadio,
  onOpenSovereign,
  onOpenDonate,
}: CaptureOverlayProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBitrateLabel = (bitrate: number) => {
    if (bitrate >= 25000000) return '25M Ultra';
    if (bitrate >= 15000000) return '15M Studio';
    if (bitrate >= 8000000) return '8M High';
    return '4M Web';
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Floating Bar */}
      <div className="flex w-full items-center justify-between gap-3">
        {/* Title Badge / Brand & Sovereign.ISP Link */}
        <div className="flex items-center gap-2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-xs font-medium tracking-wider text-white/90 shadow-xl backdrop-blur-md transition hover:bg-black/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
            </span>
            <span className="text-white font-semibold">D9 Plasma Audio</span>
            <span className="text-white/40">|</span>
            <span className="text-cyan-300/80 font-mono text-[11px] hidden md:inline">
              HD Video Generator & Studio
            </span>
          </div>

          {/* Join Sovereign.ISP Top Link */}
          {onOpenSovereign && (
            <button
              id="top-join-sovereign-btn"
              onClick={onOpenSovereign}
              title="Join Sovereign.ISP Decentralized Internet Mesh (Hotkey: J)"
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/80 px-3.5 py-1.5 text-xs font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] backdrop-blur-md transition active:scale-95 group"
            >
              <Network className="h-3.5 w-3.5 text-cyan-400 group-hover:animate-pulse" />
              <span>Join Sovereign.ISP</span>
              <ExternalLink className="h-3 w-3 text-cyan-400/70" />
            </button>
          )}

          {/* Top Quick Donate Button */}
          {onOpenDonate && (
            <button
              id="top-donate-btn"
              onClick={onOpenDonate}
              title="Support & Donate (Hotkey: D)"
              className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/60 hover:bg-rose-900/80 px-3 py-1.5 text-xs font-bold text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)] backdrop-blur-md transition active:scale-95 group"
            >
              <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-500/40 group-hover:scale-110 transition" />
              <span className="hidden sm:inline">Donate</span>
            </button>
          )}
        </div>

        {/* Recording active badge (visible during recording even if UI is hidden) */}
        {isRecording && (
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-rose-500/50 bg-rose-950/80 px-4 py-1.5 shadow-[0_0_20px_rgba(244,63,94,0.4)] backdrop-blur-md animate-pulse">
            <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
            <span className="font-mono text-sm font-bold tracking-wider text-rose-200">
              REC {formatTime(recordSeconds)}
            </span>
            <span className="text-[10px] font-semibold text-rose-300/80 bg-rose-900/60 px-2 py-0.5 rounded-full border border-rose-500/30">
              {getBitrateLabel(captureSettings.videoBitrate)} @ {captureSettings.videoFps}fps
            </span>
          </div>
        )}

        {/* Floating Quick Action Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 p-1.5 shadow-2xl backdrop-blur-md">
          {/* Studio Video Generator / Recorder Modal Button */}
          <button
            id="quick-studio-btn"
            onClick={onOpenStudio}
            title="Open Video Generator Studio (Hotkey: V)"
            aria-label="Open Video Studio"
            className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 transition hover:bg-rose-500 hover:text-white active:scale-95 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
          >
            <Film className="h-4 w-4 transition group-hover:scale-110" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
              Video Studio (V)
            </span>
          </button>

          {/* Quick TV Mode Toggle */}
          {onToggleTv && (
            <button
              id="quick-tv-btn"
              onClick={onToggleTv}
              title="Toggle Retro TV CRT Visualizer (Hotkey: T)"
              aria-label="Toggle TV Visualizer"
              className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 ${
                tvEnabled
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.6)] font-bold'
                  : 'text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <Tv className="h-4 w-4 transition group-hover:scale-110" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
                TV CRT (T)
              </span>
            </button>
          )}

          {/* Quick Radio Browser Button */}
          {onOpenRadio && (
            <button
              id="quick-radio-btn"
              onClick={onOpenRadio}
              title="Open Radio Tuner (Hotkey: L)"
              aria-label="Open Radio Stations"
              className="group relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
            >
              <Radio className="h-4 w-4 transition group-hover:scale-110 text-cyan-400" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
                Radio (L)
              </span>
            </button>
          )}

          {/* Quick Backdrop Button */}
          {onCycleBackground && (
            <button
              id="quick-bg-btn"
              onClick={onCycleBackground}
              title="Cycle Synthwave Backdrop (Hotkey: B)"
              aria-label="Cycle Background Landscape"
              className="group relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
            >
              <ImageIcon className="h-4 w-4 transition group-hover:scale-110 text-fuchsia-400" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
                Backdrop (B)
              </span>
            </button>
          )}

          {/* Quick Snapshot Button */}
          <button
            id="quick-snapshot-btn"
            onClick={onTakeSnapshot}
            title="Take Screenshot (Hotkey: S)"
            aria-label="Take snapshot"
            className="group relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            <Camera className="h-4 w-4 transition group-hover:scale-110" />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
              Snapshot (S)
            </span>
          </button>

          {/* Quick Video Record Button */}
          <button
            id="quick-record-btn"
            onClick={onToggleRecord}
            title={isRecording ? 'Stop Recording' : 'Start 60FPS Video Recording (Hotkey: R)'}
            aria-label="Toggle video recording"
            className={`group relative flex h-9 w-9 items-center justify-center rounded-full transition active:scale-95 ${
              isRecording
                ? 'bg-rose-600 text-white shadow-[0_0_15px_#f43f5e]'
                : 'text-white/80 hover:bg-white/15 hover:text-white'
            }`}
          >
            {isRecording ? (
              <Square className="h-3.5 w-3.5 fill-current animate-pulse" />
            ) : (
              <Video className="h-4 w-4 transition group-hover:scale-110 text-rose-400" />
            )}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
              {isRecording ? 'Stop REC' : 'Record (R)'}
            </span>
          </button>

          {/* Toggle Fullscreen Button */}
          <button
            id="quick-fullscreen-btn"
            onClick={onToggleFullscreen}
            title="Toggle Fullscreen (Hotkey: F)"
            aria-label="Toggle fullscreen"
            className="group relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4 transition group-hover:scale-110" />
            ) : (
              <Maximize className="h-4 w-4 transition group-hover:scale-110" />
            )}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
              Fullscreen (F)
            </span>
          </button>

          {/* Toggle UI Hide/Show Button */}
          <button
            id="quick-ui-btn"
            onClick={onToggleUi}
            title={uiVisible ? 'Hide UI (Hotkey: H)' : 'Show UI (Hotkey: H)'}
            aria-label="Toggle UI visibility"
            className="group relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
          >
            {uiVisible ? (
              <EyeOff className="h-4 w-4 transition group-hover:scale-110" />
            ) : (
              <Eye className="h-4 w-4 transition group-hover:scale-110" />
            )}
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/90 px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 pointer-events-none">
              Hide UI (H)
            </span>
          </button>
        </div>
      </div>

      {/* Floating Bottom Hotkey Helper when UI is hidden */}
      {!uiVisible && (
        <div className="pointer-events-auto flex items-center justify-center">
          <button
            onClick={onToggleUi}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-xs text-white/70 shadow-2xl backdrop-blur-md transition hover:bg-black/80 hover:text-white"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Show UI Controls (Press H)</span>
          </button>
        </div>
      )}
    </div>
  );
}
