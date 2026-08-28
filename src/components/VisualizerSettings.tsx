import React, { useState } from 'react';
import {
  VisualizerParams,
  ColorTheme,
  VisualizerMode,
  BackgroundSettings,
  TvVisualizerSettings,
  TvChassisStyle,
  TvAspectRatio,
} from '../types';
import { SYNTHWAVE_BACKGROUNDS } from '../data/backgrounds';
import {
  X,
  Sparkles,
  Zap,
  Radio,
  Sliders,
  Flame,
  Globe,
  Waves,
  Activity,
  Image as ImageIcon,
  Check,
  Power,
  Volume2,
  SlidersHorizontal,
  Contrast,
  SunMedium,
  Palette,
  Tv,
  Monitor,
  Maximize,
} from 'lucide-react';

interface VisualizerSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  params: VisualizerParams;
  setParams: React.Dispatch<React.SetStateAction<VisualizerParams>>;
  background: BackgroundSettings;
  setBackground: React.Dispatch<React.SetStateAction<BackgroundSettings>>;
  tvSettings: TvVisualizerSettings;
  setTvSettings: React.Dispatch<React.SetStateAction<TvVisualizerSettings>>;
}

const MODES: { id: VisualizerMode; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'plasma_orb', label: 'Plasma Orb', icon: Globe },
  { id: 'radial_spectrum', label: 'Radial Mandala', icon: Radio },
  { id: 'cosmic_nebula', label: 'Cosmic Nebula', icon: Sparkles },
  { id: 'lightning_matrix', label: 'Lightning Grid', icon: Zap },
  { id: 'vector_ribbon', label: 'Vector Ribbon', icon: Waves },
];

const THEMES: { id: ColorTheme; label: string; color: string }[] = [
  { id: 'cyberpunk', label: 'Cyberpunk Neon', color: 'from-cyan-400 via-fuchsia-500 to-indigo-600' },
  { id: 'solar_flare', label: 'Solar Flare', color: 'from-amber-400 via-orange-500 to-rose-600' },
  { id: 'cosmic_violet', label: 'Cosmic Violet', color: 'from-violet-500 via-indigo-500 to-blue-600' },
  { id: 'bio_emerald', label: 'Bio Emerald', color: 'from-emerald-400 via-teal-500 to-cyan-600' },
  { id: 'hyper_prism', label: 'Hyper Prism', color: 'from-red-500 via-green-500 to-blue-500' },
  { id: 'cryo_glacial', label: 'Cryo Glacial', color: 'from-cyan-300 via-sky-400 to-blue-500' },
  { id: 'obsidian_lava', label: 'Obsidian Magma', color: 'from-rose-600 via-orange-600 to-amber-600' },
];

const TV_CHASSIS: { id: TvChassisStyle; label: string; desc: string }[] = [
  {
    id: 'retro_woodgrain',
    label: '1980s Vintage Woodgrain Console',
    desc: 'Classic walnut cabinet with gold trim, speaker grilles & rotary knobs',
  },
  {
    id: 'cyber_monitor',
    label: 'Cyberpunk Broadcast PVM',
    desc: 'Studio reference monitor with neon cyan casing and telemetry badges',
  },
  {
    id: 'borderless_crt',
    label: 'Borderless CRT Shader Simulation',
    desc: 'Curved glass bulge, phosphor grid, and retro scanlines on full canvas',
  },
];

export const VisualizerSettings: React.FC<VisualizerSettingsProps> = ({
  isOpen,
  onClose,
  params,
  setParams,
  background,
  setBackground,
  tvSettings,
  setTvSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'backgrounds' | 'tv_crt' | 'optics'>('tv_crt');

  if (!isOpen) return null;

  const updateParam = <K extends keyof VisualizerParams>(key: K, val: VisualizerParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  const updateBg = <K extends keyof BackgroundSettings>(key: K, val: BackgroundSettings[K]) => {
    setBackground((prev) => ({ ...prev, [key]: val }));
  };

  const updateTv = <K extends keyof TvVisualizerSettings>(key: K, val: TvVisualizerSettings[K]) => {
    setTvSettings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSelectLandscape = (bgId: string, themeMatch?: ColorTheme) => {
    setBackground((prev) => ({
      ...prev,
      enabled: bgId !== 'none',
      selectedId: bgId,
    }));

    if (themeMatch && bgId !== 'none') {
      setParams((prev) => ({ ...prev, theme: themeMatch }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="visualizer-settings-modal"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/20 bg-[#0c0c16]/95 text-white shadow-2xl backdrop-blur-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
              {activeTab === 'tv_crt' ? (
                <Tv className="h-5 w-5 text-amber-400" />
              ) : activeTab === 'backgrounds' ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Visualizer Studio & TV CRT Engine
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.2
                </span>
              </h3>
              <p className="text-xs text-white/50">Retro TV visualizer, synthwave backdrops & optics</p>
            </div>
          </div>

          <button
            id="btn-close-visualizer-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-white/10 bg-white/[0.01]">
          <button
            id="tab-tv-crt"
            onClick={() => setActiveTab('tv_crt')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
              activeTab === 'tv_crt'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <Tv className="h-4 w-4" />
            <span>Retro TV & CRT</span>
            {tvSettings.enabled && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            id="tab-synthwave-backgrounds"
            onClick={() => setActiveTab('backgrounds')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
              activeTab === 'backgrounds'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>Synthwave Landscapes</span>
            {background.enabled && background.selectedId !== 'none' && (
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>

          <button
            id="tab-visualizer-optics"
            onClick={() => setActiveTab('optics')}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all ${
              activeTab === 'optics'
                ? 'border-indigo-400 text-indigo-300 bg-indigo-500/10 rounded-t-lg'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Optics & Shaders</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 max-h-[calc(90vh-140px)]">
          {activeTab === 'tv_crt' ? (
            /* TAB 1: RETRO TV & CRT VISUALIZER */
            <div className="space-y-6">
              {/* Master TV Toggle Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-black border border-amber-500/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Tv className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">Retro CRT Television Mode</h4>
                    <p className="text-xs text-amber-300/60">
                      Renders the visualizer inside a vintage CRT TV cabinet with rotary knobs & scanlines
                    </p>
                  </div>
                </div>

                <button
                  id="toggle-tv-mode"
                  onClick={() => updateTv('enabled', !tvSettings.enabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    tvSettings.enabled
                      ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>{tvSettings.enabled ? 'ENABLED' : 'DISABLED'}</span>
                </button>
              </div>

              {/* TV Chassis Style Selection */}
              <div>
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-3">
                  Television Chassis & Enclosure
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TV_CHASSIS.map((c) => {
                    const isSelected = tvSettings.chassis === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => updateTv('chassis', c.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500/80 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                            : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                            {c.label}
                          </span>
                          {isSelected && <Check className="h-4 w-4 text-amber-400" />}
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed">{c.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CRT Aspect Ratio & Screen Glass Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                    Aspect Ratio
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateTv('aspectRatio', '4:3')}
                      className={`py-2 rounded-lg text-xs font-bold border transition ${
                        tvSettings.aspectRatio === '4:3'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      4:3 Retro Box
                    </button>
                    <button
                      onClick={() => updateTv('aspectRatio', '16:9')}
                      className={`py-2 rounded-lg text-xs font-bold border transition ${
                        tvSettings.aspectRatio === '16:9'
                          ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                          : 'border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      16:9 Widescreen
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wider block">
                    Retro CRT Shaders & FX
                  </span>
                  <label className="flex items-center justify-between text-xs text-white/70 cursor-pointer">
                    <span>Phosphor RGB Glow Mask</span>
                    <input
                      type="checkbox"
                      checked={tvSettings.phosphorGlow}
                      onChange={(e) => updateTv('phosphorGlow', e.target.checked)}
                      className="accent-amber-400 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-white/70 cursor-pointer">
                    <span>On-Screen Display (OSD Channel)</span>
                    <input
                      type="checkbox"
                      checked={tvSettings.showOsd}
                      onChange={(e) => updateTv('showOsd', e.target.checked)}
                      className="accent-amber-400 rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-white/70 cursor-pointer">
                    <span>Channel Switch Static Burst</span>
                    <input
                      type="checkbox"
                      checked={tvSettings.staticBurstOnChange}
                      onChange={(e) => updateTv('staticBurstOnChange', e.target.checked)}
                      className="accent-amber-400 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : activeTab === 'backgrounds' ? (
            /* TAB 2: ETHEREAL SYNTHWAVE LANDSCAPES */
            <div className="space-y-6">
              {/* Enable Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-black border border-indigo-500/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Backdrop Landscape</h4>
                    <p className="text-xs text-white/50">Synthwave landscapes synced to audio bass</p>
                  </div>
                </div>

                <button
                  onClick={() => updateBg('enabled', !background.enabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    background.enabled
                      ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>{background.enabled ? 'ACTIVE' : 'OFF'}</span>
                </button>
              </div>

              {/* Landscape Grid Selector */}
              <div>
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-3">
                  Landscape Theme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* None Option */}
                  <div
                    onClick={() => handleSelectLandscape('none')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      !background.enabled || background.selectedId === 'none'
                        ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="h-12 w-12 rounded-lg bg-black border border-white/10 flex items-center justify-center text-white/40">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Pure Cosmic Void</h5>
                      <p className="text-[11px] text-white/50">Deep pitch-black visualizer space</p>
                    </div>
                  </div>

                  {/* Curated Backgrounds */}
                  {SYNTHWAVE_BACKGROUNDS.map((bg) => {
                    const isSelected = background.enabled && background.selectedId === bg.id;
                    return (
                      <div
                        key={bg.id}
                        onClick={() => handleSelectLandscape(bg.id, bg.themeMatch)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-white/15 bg-slate-900 relative">
                          <img
                            src={bg.imageUrl}
                            alt={bg.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-white truncate">{bg.name}</h5>
                            {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-white/50 truncate">{bg.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Background Tuning Sliders */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">Backdrop Opacity</span>
                    <span className="font-mono text-indigo-300 font-bold">{Math.round(background.opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={background.opacity}
                    onChange={(e) => updateBg('opacity', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">Gaussian Blur Depth</span>
                    <span className="font-mono text-indigo-300 font-bold">{background.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={background.blur}
                    onChange={(e) => updateBg('blur', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* TAB 3: VISUALIZER OPTICS & SHADERS */
            <div className="space-y-6">
              {/* Playback Target FPS */}
              <div>
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-3">
                  Playback Framerate (FPS)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { fps: 60, label: '60 FPS', desc: 'Smooth' },
                    { fps: 30, label: '30 FPS', desc: 'Standard' },
                    { fps: 25, label: '25 FPS', desc: 'Cinematic / Eco' },
                  ].map((opts) => {
                    // Treat undefined or 60 as 60
                    const currentFps = params.targetFps || 60;
                    const isSelected = currentFps === opts.fps;
                    return (
                      <button
                        key={opts.fps}
                        onClick={() => updateParam('targetFps', opts.fps)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="font-mono text-sm font-bold text-indigo-400">{opts.fps}</span>
                        <span className="text-[10px]">{opts.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visualizer Mode */}
              <div>
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-3">
                  Visualizer Architecture
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {MODES.map((m) => {
                    const Icon = m.icon;
                    const isSelected = params.mode === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => updateParam('mode', m.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4 text-indigo-400" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Theme */}
              <div>
                <label className="text-xs font-semibold text-white/80 uppercase tracking-wider block mb-3">
                  Color Plasma Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {THEMES.map((t) => {
                    const isSelected = params.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => updateParam('theme', t.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                            : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className={`h-3.5 w-3.5 rounded-full bg-gradient-to-r ${t.color}`} />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders for Plasma Reactivity & Arcs */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">Sub-Bass Spark Reactivity</span>
                    <span className="font-mono text-indigo-300 font-bold">{params.bassReactivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={params.bassReactivity}
                    onChange={(e) => updateParam('bassReactivity', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">Plasma Arcs / Particle Density</span>
                    <span className="font-mono text-indigo-300 font-bold">{params.arcs} Arcs</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="48"
                    step="2"
                    value={params.arcs}
                    onChange={(e) => updateParam('arcs', parseInt(e.target.value))}
                    className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                  />
                </div>
              </div>

              {/* Advanced Auto-Randomizer & Speed */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-xl">
                  <div>
                    <h5 className="text-xs font-bold text-indigo-300">Fast Auto-Randomizer</h5>
                    <p className="text-[10px] text-white/50">Rapidly cycle through modes, speeds, and themes</p>
                  </div>
                  <button
                    onClick={() => updateParam('autoRandomize', !params.autoRandomize)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      params.autoRandomize
                        ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>{params.autoRandomize ? 'ACTIVE' : 'OFF'}</span>
                  </button>
                </div>

                {params.autoRandomize && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/70">Randomizer Interval</span>
                      <span className="font-mono text-indigo-300 font-bold">{(params.autoRandomizeInterval || 2500) / 1000}s</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="15000"
                      step="500"
                      value={params.autoRandomizeInterval || 2500}
                      onChange={(e) => updateParam('autoRandomizeInterval', parseInt(e.target.value))}
                      className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/70">Base Render Speed (Tempo)</span>
                    <span className="font-mono text-indigo-300 font-bold">{params.speed.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="4.0"
                    step="0.05"
                    value={params.speed}
                    onChange={(e) => updateParam('speed', parseFloat(e.target.value))}
                    disabled={params.autoRandomize}
                    className={`w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-400 ${params.autoRandomize ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <p className="text-[10px] text-white/40 mt-1">
                    Slide left for very slow cinematic movement. Locked while Auto-Randomizer is active.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
