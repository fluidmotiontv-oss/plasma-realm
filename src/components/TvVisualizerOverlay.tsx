import React, { useState, useEffect } from 'react';
import { TvVisualizerSettings, Track, RadioStation } from '../types';
import { RADIO_STATIONS } from '../data/radioStations';
import { audioEngine } from '../audio/AudioEngine';
import {
  Tv,
  Radio,
  Volume2,
  Power,
  Sliders,
  RotateCw,
  Signal,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TvVisualizerOverlayProps {
  settings: TvVisualizerSettings;
  setSettings: React.Dispatch<React.SetStateAction<TvVisualizerSettings>>;
  currentTrack: Track | null;
  isPlaying: boolean;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onSelectStation?: (station: RadioStation) => void;
  channelIndex?: number;
}

export const TvVisualizerOverlay: React.FC<TvVisualizerOverlayProps> = ({
  settings,
  setSettings,
  currentTrack,
  isPlaying,
  onNextChannel,
  onPrevChannel,
  onSelectStation,
  channelIndex = 1,
}) => {
  const [isChannelChanging, setIsChannelChanging] = useState(false);
  const [knobRotation, setKnobRotation] = useState(0);
  const [osdTimer, setOsdTimer] = useState<number | null>(null);
  const [showChannelBanner, setShowChannelBanner] = useState(true);

  // Trigger brief static burst & OSD banner whenever track or channel changes
  useEffect(() => {
    if (settings.enabled && settings.staticBurstOnChange) {
      setIsChannelChanging(true);
      setShowChannelBanner(true);

      const staticTimer = setTimeout(() => {
        setIsChannelChanging(false);
      }, 240);

      const bannerTimer = setTimeout(() => {
        setShowChannelBanner(false);
      }, 4000);

      return () => {
        clearTimeout(staticTimer);
        clearTimeout(bannerTimer);
      };
    }
  }, [currentTrack?.id, settings.enabled, settings.staticBurstOnChange]);

  if (!settings.enabled) return null;

  const handleKnobClick = () => {
    setKnobRotation((prev) => prev + 36);
    audioEngine.playRadioTuningSound();
    if (onNextChannel) {
      onNextChannel();
    }
  };

  const currentStation = RADIO_STATIONS.find(
    (s) => s.id === currentTrack?.radioStationId || currentTrack?.title === s.name
  );

  const channelNumber = currentStation
    ? (RADIO_STATIONS.findIndex((s) => s.id === currentStation.id) + 1).toString().padStart(2, '0')
    : (channelIndex || 1).toString().padStart(2, '0');

  const channelName = currentTrack?.title || 'D9 PLASMA BROADCAST';
  const frequencyLabel = currentTrack?.frequency || '104.3 MHz';

  return (
    <div
      id="tv-visualizer-overlay"
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center overflow-hidden"
    >
      {/* Outer Retro TV Cabinet / Bezel Frame */}
      {settings.chassis === 'retro_woodgrain' && (
        <div className="pointer-events-auto relative flex items-center justify-center p-6 sm:p-10 rounded-[36px] bg-gradient-to-b from-[#2a170e] via-[#1a0e08] to-[#0d0704] border-[14px] border-[#4a2e1b] shadow-[0_25px_80px_rgba(0,0,0,0.95),inset_0_3px_6px_rgba(255,255,255,0.15)] max-w-full max-h-full">
          {/* Woodgrain texture gradient accent lines */}
          <div className="absolute inset-2 rounded-[24px] border border-[#6b4428]/40 pointer-events-none opacity-60" />

          {/* Golden Vintage Nameplate */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-0.5 rounded bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-800 border border-yellow-500/40 text-[9px] font-serif font-black tracking-[0.25em] text-yellow-100 uppercase shadow-md">
            FLUIDMOTION HI-FI COLOR TRINITRON
          </div>

          {/* Dual Chrome Rabbit-Ear Antennas atop */}
          <div className="absolute -top-12 left-1/4 h-16 w-1 bg-gradient-to-t from-zinc-400 to-zinc-200 -rotate-25 rounded-full shadow-lg pointer-events-none hidden md:block" />
          <div className="absolute -top-12 right-1/4 h-16 w-1 bg-gradient-to-t from-zinc-400 to-zinc-200 rotate-25 rounded-full shadow-lg pointer-events-none hidden md:block" />

          {/* Main TV Screen Container */}
          <div
            className={`relative overflow-hidden rounded-[28px] border-[10px] border-[#141416] bg-black shadow-[inset_0_0_60px_rgba(0,0,0,0.95)] transition-all duration-300 ${
              settings.aspectRatio === '4:3'
                ? 'w-[75vw] sm:w-[68vw] max-w-[900px] aspect-[4/3]'
                : 'w-[88vw] max-w-[1100px] aspect-[16/9]'
            }`}
          >
            {/* CRT Screen Mask, Glass Reflections & Scanlines */}
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Curved Glass Vignette & Tube Bulge Shadow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.75)_100%)] shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]" />

              {/* Glass Specular Glare Arc */}
              <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-[28px] opacity-40" />

              {/* CRT Scanline Shader */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1.5px, transparent 1.5px, transparent 3px)',
                }}
              />

              {/* RGB Phosphor Shadow Mask */}
              {settings.phosphorGlow && (
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(90deg, rgba(255,0,0,0.2) 0px, rgba(0,255,0,0.2) 1px, rgba(0,0,255,0.2) 2px, transparent 3px)',
                  }}
                />
              )}

              {/* Screen Static / Snow Burst on Channel Change */}
              {isChannelChanging && (
                <div className="absolute inset-0 z-30 bg-[#111] opacity-80 flex items-center justify-center animate-pulse">
                  <div
                    className="w-full h-full opacity-70"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, #fff 10%, transparent 11%), radial-gradient(circle, #888 10%, transparent 11%)',
                      backgroundSize: '4px 4px',
                    }}
                  />
                  <div className="absolute font-mono text-xs text-white bg-black/80 px-3 py-1 rounded border border-white/20">
                    TUNING FREQUENCY...
                  </div>
                </div>
              )}

              {/* Retro OSD (On-Screen Display) */}
              {(showChannelBanner || settings.showOsd) && (
                <div className="absolute top-6 left-6 z-20 font-mono text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)] select-none">
                  <div className="flex items-center gap-2 text-sm sm:text-base font-black tracking-widest">
                    <span>CH {channelNumber}</span>
                    <span className="text-white/40">•</span>
                    <span className="truncate max-w-[240px] sm:max-w-md uppercase">{channelName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-emerald-300/80 mt-1">
                    <span className="px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-500/40 rounded text-[10px]">
                      {frequencyLabel}
                    </span>
                    <span className="tracking-wider">STEREO / NTSC</span>
                    <div className="flex items-center gap-0.5">
                      <Signal className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px]">HIGH</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-emerald-400/60 mt-0.5 tracking-widest">
                    ▶ PLAY  SP  0:24:18
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right-Side Retro Woodgrain TV Control Panel */}
          <div className="hidden lg:flex flex-col items-center justify-between ml-6 py-3 px-3 w-32 bg-[#1c110a] rounded-2xl border-2 border-[#3d2414] shadow-inner text-amber-100">
            {/* Top Vintage Speaker Grille */}
            <div className="w-full space-y-1.5 py-2">
              <div className="h-1 bg-black/60 rounded-full shadow-inner" />
              <div className="h-1 bg-black/60 rounded-full shadow-inner" />
              <div className="h-1 bg-black/60 rounded-full shadow-inner" />
              <div className="h-1 bg-black/60 rounded-full shadow-inner" />
              <div className="h-1 bg-black/60 rounded-full shadow-inner" />
            </div>

            {/* Rotary VHF/UHF Channel Knob */}
            <div className="flex flex-col items-center my-3">
              <span className="text-[9px] font-mono tracking-wider text-amber-300/80 font-bold uppercase mb-1">
                CHANNEL
              </span>
              <button
                onClick={handleKnobClick}
                className="relative h-14 w-14 rounded-full bg-gradient-to-tr from-zinc-800 via-zinc-700 to-zinc-900 border-4 border-amber-600/40 shadow-[0_4px_10px_rgba(0,0,0,0.8)] active:scale-95 transition-transform flex items-center justify-center cursor-pointer group"
                title="Click to Switch Channel"
              >
                {/* Pointer indicator line */}
                <div
                  className="absolute h-6 w-1 bg-amber-400 rounded-full top-1 transition-transform duration-200"
                  style={{ transform: `rotate(${knobRotation}deg)`, transformOrigin: 'bottom center' }}
                />
                <div className="h-4 w-4 rounded-full bg-zinc-900 border border-zinc-600" />
              </button>
              <span className="text-[10px] font-mono text-amber-400 mt-1 font-bold">
                CH {channelNumber}
              </span>
            </div>

            {/* Fine Tuning Knob */}
            <div className="flex flex-col items-center my-2">
              <span className="text-[8px] font-mono tracking-wider text-amber-300/60 uppercase mb-1">
                TUNING
              </span>
              <button
                onClick={handleKnobClick}
                className="h-10 w-10 rounded-full bg-zinc-800 border-2 border-zinc-600 shadow-md active:scale-95 flex items-center justify-center"
              >
                <div className="h-2 w-2 rounded-full bg-amber-500" />
              </button>
            </div>

            {/* Power & Aspect Ratio Toggle Switch */}
            <div className="w-full pt-3 border-t border-amber-900/40 flex flex-col gap-2">
              <button
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    aspectRatio: prev.aspectRatio === '4:3' ? '16:9' : '4:3',
                  }))
                }
                className="w-full py-1 rounded bg-black/40 border border-amber-500/30 text-[9px] font-mono text-amber-200 hover:bg-black/60 transition"
              >
                RATIO: {settings.aspectRatio}
              </button>

              <button
                onClick={() => setSettings((prev) => ({ ...prev, enabled: false }))}
                className="w-full py-1.5 rounded bg-red-950/60 border border-red-500/40 text-[10px] font-bold text-red-200 hover:bg-red-900/80 transition flex items-center justify-center gap-1"
              >
                <Power className="h-3 w-3" />
                <span>TV OFF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cyberpunk PVM Studio Monitor Chassis */}
      {settings.chassis === 'cyber_monitor' && (
        <div className="pointer-events-auto relative flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-[#0e1017] border-4 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.3)] max-w-full max-h-full">
          {/* Top Status LED Header */}
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-cyan-500/20 text-[10px] font-mono text-cyan-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-bold">CYBER-PVM 9000</span>
            </div>
            <div className="flex items-center gap-3">
              <span>SYNC: LOCKED</span>
              <span className="text-pink-400">CH {channelNumber}</span>
            </div>
          </div>

          {/* Screen */}
          <div
            className={`relative overflow-hidden rounded-xl border-2 border-cyan-500/50 bg-black shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] ${
              settings.aspectRatio === '4:3'
                ? 'w-[75vw] sm:w-[68vw] max-w-[900px] aspect-[4/3]'
                : 'w-[88vw] max-w-[1100px] aspect-[16/9]'
            }`}
          >
            {/* Scanlines & RGB grid */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30 z-20"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(0, 240, 255, 0.2) 0px, transparent 1.5px, transparent 3px)',
              }}
            />

            {/* OSD */}
            <div className="absolute top-4 left-4 z-20 font-mono text-cyan-400 text-xs">
              <div>[BROADCAST {channelNumber}] {channelName}</div>
              <div className="text-[10px] text-cyan-300/70">{frequencyLabel} • HIGH GAIN</div>
            </div>
          </div>
        </div>
      )}

      {/* Borderless CRT Filter Mode */}
      {(settings.chassis === 'borderless_crt' || settings.chassis === 'portable_crt') && (
        <div className="pointer-events-none fixed inset-0 z-30">
          {/* Subtle Outer Curved Bezel Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.85)_100%)] shadow-[inset_0_0_120px_rgba(0,0,0,0.9)]" />

          {/* Scanlines */}
          <div
            className="absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0px, rgba(0, 0, 0, 0.6) 1.5px, transparent 1.5px, transparent 3px)',
            }}
          />

          {/* Top-Left OSD */}
          {showChannelBanner && (
            <div className="absolute top-20 left-6 z-20 font-mono text-emerald-400 text-sm bg-black/80 border border-emerald-500/40 p-2.5 rounded-lg shadow-xl backdrop-blur-md">
              <div className="font-bold">CH {channelNumber} • {channelName}</div>
              <div className="text-xs text-emerald-300/70">{frequencyLabel} • STEREO HI-FI</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
