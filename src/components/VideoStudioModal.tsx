import React from 'react';
import {
  CaptureSettings,
  ImageFormat,
  RecordTimerMode,
  VideoAspectRatio,
  VideoBitrate,
  VideoFPS,
  VideoResolution,
} from '../types';
import {
  X,
  Video,
  Camera,
  Film,
  Sparkles,
  Clock,
  Ratio,
  Layers,
  Check,
  Disc,
  Play,
  Square,
  Volume2,
  Tv,
  Settings2,
  Share2,
} from 'lucide-react';

interface VideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  captureSettings: CaptureSettings;
  setCaptureSettings: React.Dispatch<React.SetStateAction<CaptureSettings>>;
  isRecording: boolean;
  recordSeconds: number;
  onToggleRecord: () => void;
  onTakeSnapshot: () => void;
  currentTrackTitle?: string;
}

export const VideoStudioModal: React.FC<VideoStudioModalProps> = ({
  isOpen,
  onClose,
  captureSettings,
  setCaptureSettings,
  isRecording,
  recordSeconds,
  onToggleRecord,
  onTakeSnapshot,
  currentTrackTitle,
}) => {
  if (!isOpen) return null;

  const updateSetting = <K extends keyof CaptureSettings>(key: K, val: CaptureSettings[K]) => {
    setCaptureSettings((prev) => ({ ...prev, [key]: val }));
  };

  const updateWatermark = (key: keyof CaptureSettings['watermark'], val: unknown) => {
    setCaptureSettings((prev) => ({
      ...prev,
      watermark: {
        ...prev.watermark,
        [key]: val,
      },
    }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const ASPECT_RATIOS: { id: VideoAspectRatio; label: string; desc: string; iconDesc: string }[] = [
    {
      id: '16:9',
      label: '16:9 Landscape',
      desc: 'YouTube / Desktop 4K & 1080p',
      iconDesc: 'w-7 h-4',
    },
    {
      id: '9:16',
      label: '9:16 Vertical',
      desc: 'TikTok / Instagram Reels / Shorts',
      iconDesc: 'w-4 h-7',
    },
    {
      id: '1:1',
      label: '1:1 Square',
      desc: 'Instagram Posts / Spotify Canvas',
      iconDesc: 'w-5 h-5',
    },
    {
      id: '4:3',
      label: '4:3 Vintage CRT',
      desc: 'Retro TV & Synthwave Broadcast',
      iconDesc: 'w-6 h-4.5',
    },
  ];

  const BITRATES: { id: VideoBitrate; label: string; desc: string }[] = [
    { id: 25000000, label: '25 Mbps Ultra Master', desc: 'Maximum bitrate for 4K / 1080p60 masters' },
    { id: 15000000, label: '15 Mbps Studio Pro', desc: 'Pristine fidelity with smooth encoding' },
    { id: 8000000, label: '8 Mbps High Web', desc: 'Standard high-definition web sharing' },
    { id: 4000000, label: '4 Mbps Compact', desc: 'Lightweight for fast uploads and messaging' },
  ];

  const TIMERS: { id: RecordTimerMode; label: string; desc: string }[] = [
    { id: 'manual', label: 'Manual Stop', desc: 'Record freely until you press Stop' },
    { id: '15s', label: '15 Seconds', desc: 'Shorts & Instagram Story clips' },
    { id: '30s', label: '30 Seconds', desc: 'Social video & Reels clip' },
    { id: '60s', label: '60 Seconds', desc: '1-minute high-impact video' },
    { id: '180s', label: '3 Minutes', desc: 'Full-length visualizer track' },
    { id: 'track_end', label: 'Full Track', desc: 'Auto-stops when current song finishes' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="video-studio-modal"
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-white/20 bg-[#0b0c16]/95 text-white shadow-2xl backdrop-blur-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Video Generator & 60FPS Recorder Studio
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  PRO STUDIO
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Capture bass-synced 60FPS visualizer videos with studio master audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Record & Active Status Banner */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              isRecording
                ? 'bg-rose-950/70 border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.3)]'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full ${
                    isRecording ? 'bg-rose-500 animate-ping' : 'bg-white/30'
                  }`}
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {isRecording ? 'RECORDING IN PROGRESS' : 'Studio Engine Ready'}
                    {isRecording && (
                      <span className="font-mono text-rose-300 font-bold text-base">
                        {formatTime(recordSeconds)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/60">
                    {isRecording
                      ? `Encoding @ ${captureSettings.videoFps} FPS • ${(
                          captureSettings.videoBitrate / 1000000
                        ).toFixed(0)} Mbps Bitrate`
                      : `Target: ${captureSettings.aspectRatio} • ${captureSettings.videoFps} FPS • ${
                          captureSettings.timerMode === 'manual'
                            ? 'Manual Stop'
                            : `Timer: ${captureSettings.timerMode}`
                        }`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  id="btn-studio-toggle-record"
                  onClick={onToggleRecord}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition active:scale-95 ${
                    isRecording
                      ? 'bg-white text-rose-600 hover:bg-rose-100 shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'bg-rose-600 text-white hover:bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 fill-current" />
                      <span>Stop & Save Video</span>
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      <span>Start 60FPS Video Capture</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-studio-take-snapshot"
                  onClick={onTakeSnapshot}
                  title="Take High-Res Snapshot"
                  className="flex items-center justify-center p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition active:scale-95"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Video Aspect Ratio Presets */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2.5 flex items-center gap-2">
              <Ratio className="h-4 w-4 text-cyan-400" />
              Target Aspect Ratio & Canvas Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ASPECT_RATIOS.map((ar) => {
                const isActive = captureSettings.aspectRatio === ar.id;
                return (
                  <button
                    key={ar.id}
                    onClick={() => updateSetting('aspectRatio', ar.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`rounded border ${
                          isActive ? 'border-cyan-400 bg-cyan-400/20' : 'border-white/30'
                        } ${ar.iconDesc}`}
                      />
                      {isActive && <Check className="h-4 w-4 text-cyan-400" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{ar.label}</div>
                      <div className="text-[10px] text-white/50 line-clamp-1">{ar.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Rate & Bitrate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* FPS Selector */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/30">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-3 flex items-center justify-between">
                <span>Capture Frame Rate</span>
                <span className="font-mono text-cyan-400">{captureSettings.videoFps} FPS</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateSetting('videoFps', 60)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    captureSettings.videoFps === 60
                      ? 'border-cyan-500 bg-cyan-600 text-white shadow'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  60 FPS (Ultra Smooth)
                </button>
                <button
                  onClick={() => updateSetting('videoFps', 30)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition ${
                    captureSettings.videoFps === 30
                      ? 'border-cyan-500 bg-cyan-600 text-white shadow'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  30 FPS (Standard)
                </button>
              </div>
            </div>

            {/* Audio Stream Capture Toggle */}
            <div className="p-4 rounded-xl border border-white/10 bg-black/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                    Synchronized Master Audio
                  </div>
                  <div className="text-[11px] text-white/50">
                    Embed lossless 320kbps audio into video file
                  </div>
                </div>
                <button
                  onClick={() => updateSetting('includeAudio', !captureSettings.includeAudio)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    captureSettings.includeAudio ? 'bg-emerald-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      captureSettings.includeAudio ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-[10px] font-mono text-emerald-400/80 mt-2">
                Format: WebM / MP4 (Opus/AAC Sync)
              </div>
            </div>
          </div>

          {/* Video Bitrate Quality */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2.5 flex items-center gap-2">
              <Film className="h-4 w-4 text-rose-400" />
              Encoding Bitrate & Master Quality
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BITRATES.map((b) => {
                const isActive = captureSettings.videoBitrate === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => updateSetting('videoBitrate', b.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isActive
                        ? 'border-rose-500 bg-rose-950/40 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{b.label}</div>
                      <div className="text-[10px] text-white/50">{b.desc}</div>
                    </div>
                    {isActive && <Check className="h-4 w-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto-Stop Timer Mode */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2.5 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Automated Recording Timer
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TIMERS.map((t) => {
                const isActive = captureSettings.timerMode === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => updateSetting('timerMode', t.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-amber-500 bg-amber-950/40 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      {t.label}
                      {isActive && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-white/50">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title Card & Video Watermark Settings */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              Video Overlay & Branding
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={captureSettings.watermark?.showTitleCard ?? true}
                  onChange={(e) => updateWatermark('showTitleCard', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0"
                />
                <span>Include Track Title & Artist in Video</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={captureSettings.watermark?.showTimestamp ?? true}
                  onChange={(e) => updateWatermark('showTimestamp', e.target.checked)}
                  className="rounded border-white/20 bg-white/10 text-indigo-600 focus:ring-0"
                />
                <span>Include Date & Time Stamp</span>
              </label>
            </div>

            <div>
              <label className="text-[11px] text-white/50 mb-1 block">
                Custom Watermark / Channel Handle (Optional):
              </label>
              <input
                type="text"
                value={captureSettings.watermark?.customWatermark || ''}
                onChange={(e) => updateWatermark('customWatermark', e.target.value)}
                placeholder="e.g. @MyChannel or Visualizer Studio"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Snapshot Generator Settings */}
          <div className="p-4 rounded-xl border border-white/10 bg-black/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-semibold text-white">Snapshot Image Format</span>
              </div>
              <div className="flex items-center gap-1.5">
                {(['png', 'webp', 'jpeg'] as ImageFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => updateSetting('imageFormat', fmt)}
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition ${
                      captureSettings.imageFormat === fmt
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white/10 text-white/60 hover:text-white'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-white/50">
              High-resolution frame grabs will be exported immediately at maximum canvas clarity.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="text-xs text-white/40">
            Hotkey: <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">R</kbd> to Record • <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono">S</kbd> for Snapshot
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
