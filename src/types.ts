export type VisualizerMode = 
  | 'plasma_orb'
  | 'radial_spectrum'
  | 'cosmic_nebula'
  | 'lightning_matrix'
  | 'vector_ribbon';

export type ColorTheme = 
  | 'cyberpunk'
  | 'solar_flare'
  | 'cosmic_violet'
  | 'bio_emerald'
  | 'hyper_prism'
  | 'cryo_glacial'
  | 'obsidian_lava';

export interface VisualizerParams {
  mode: VisualizerMode;
  theme: ColorTheme;
  arcs: number;
  complexity: number;
  displacement: number;
  width: number;
  glow: number;
  speed: number;
  particleCount: number;
  shockwaveIntensity: number;
  beatFlash: boolean;
  emfSpiral: boolean;
  cameraShake: boolean;
  bassReactivity: number;
  highReactivity: number;
  customHue?: number;
  targetFps?: number;
  autoRandomize?: boolean;
  autoRandomizeInterval?: number;
}

export type TvChassisStyle = 'retro_woodgrain' | 'cyber_monitor' | 'portable_crt' | 'borderless_crt';
export type TvAspectRatio = '4:3' | '16:9' | 'fullscreen';

export interface TvVisualizerSettings {
  enabled: boolean;
  chassis: TvChassisStyle;
  aspectRatio: TvAspectRatio;
  curvature: boolean;
  scanlineIntensity: number; // 0 to 1
  phosphorGlow: boolean;
  screenFlicker: boolean;
  showOsd: boolean; // On-Screen Display (Channel name, frequency, tracking)
  staticBurstOnChange: boolean;
  rgbShift: boolean;
  glitchNoise: number; // 0 to 1
  channelIndex: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre: string;
  duration: number; // in seconds
  coverArt?: string;
  type: 'file' | 'stream' | 'radio';
  audioUrl?: string;
  streamUrl?: string;
  file?: File;
  radioStationId?: string;
  frequency?: string;
  frequencyVal?: number;
  bitrate?: string;
  isLiveRadio?: boolean;
}

export interface RadioStation {
  id: string;
  name: string;
  frequency: string; // e.g. "94.5 MHz", "101.2 SOMA", "88.9 DEFCON"
  frequencyVal: number; // e.g. 94.5 (numeric for analog tuner dial)
  tagline: string;
  genre: string;
  streamUrl: string;
  bitrate: string;
  location: string;
  accentColor: string;
  coverArt: string;
  country?: string;
  isFavorite?: boolean;
}

export interface ThreeDLayerSettings {
  enabled: boolean;
  depthSpread: number; // 0.2 to 2.5 (Z-plane layer separation)
  fov: number; // 250 to 900 (Perspective focal distance)
  pitch: number; // -1.5 to 1.5 rad
  yaw: number; // -3.14 to 3.14 rad
  roll: number; // -1.0 to 1.0 rad
  autoOrbit: boolean;
  orbitSpeed: number; // 0.1 to 2.5
  mouseParallax: boolean;
  anaglyph3D: boolean; // Stereoscopic Red-Cyan Chromatic split
  hologramGrid: boolean; // Layer 0: 3D Cyber Horizon Floor
  volumetricRings: boolean; // Layer 1: 3D Orbit Gyro Rings
  corePlasma3D: boolean; // Layer 2: 3D Spherical Plasma Arcs
  sparkCloud3D: boolean; // Layer 3: 3D Bass-Synchronized Spark Cloud
  hudOverlay3D: boolean; // Layer 4: 3D Holographic Radio Dial HUD
}

export interface AudioAnalysis {
  subBass: number;   // 0 - 1
  bass: number;      // 0 - 1
  lowMid: number;    // 0 - 1
  mid: number;       // 0 - 1
  high: number;      // 0 - 1
  treble: number;    // 0 - 1
  overallAmp: number;// 0 - 1
  isBeat: boolean;
  beatIntensity: number;
  energyHistory: number[];
}

export type ComfortMode = 'safe_master' | 'night_mode' | 'anti_harsh' | 'auto_normalize' | 'bass_protect';

export interface AudioProofSettings {
  limiterEnabled: boolean;
  ceilingDb: number; // -0.5 to -6.0 dBFS
  limiterThreshold: number; // -6 to -24 dBFS
  autoGainControl: boolean; // Auto-leveling for sudden quiet/loud shifts
  antiHarshDeEsser: boolean; // Tames 5.5k-8k harsh frequencies
  ultrasonicFilter: boolean; // Strips >19kHz digital whistling
  softSaturation: boolean; // Warm analog rounding to prevent digital clipping
  comfortMode: ComfortMode;
  nightMode: boolean; // Dynamic range compression + gentle low-end rumble roll-off
  earFatigueGuard: boolean; // Adaptive smoothing on sudden transients
}

export interface AudioProofMetrics {
  peakDb: number;
  gainReductionDb: number;
  rmsDb: number;
  isPeakGuarded: boolean;
  clippingPrevented: number;
  status: 'optimal' | 'limiting' | 'guarded' | 'clipping_prevented';
}

export interface EqualizerSettings {
  subBass: number;  // 60Hz: -12 to 12 dB
  bass: number;     // 250Hz: -12 to 12 dB
  mid: number;      // 1000Hz: -12 to 12 dB
  high: number;     // 4000Hz: -12 to 12 dB
  treble: number;   // 12000Hz: -12 to 12 dB
  bassBoost: number; // 0 to 12 dB sub-harmonic low-end boost
  stereoWidth: number; // 0.5 to 2.0 spatial acoustic spread
  dynamicsLimiter: boolean; // Studio peak master limiter
  presetName: string;
  audioProof?: AudioProofSettings;
}

export type VideoBitrate = 4000000 | 8000000 | 15000000 | 25000000;
export type VideoFPS = 25 | 30 | 60;
export type VideoResolution = '4k' | '1080p' | '720p';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export type RecordTimerMode = 'manual' | '15s' | '30s' | '60s' | '180s' | 'track_end';
export type ImageFormat = 'png' | 'jpeg' | 'webp';

export interface WatermarkSettings {
  showTitleCard: boolean; // Show Track title & artist badge on video
  showSpectrumOverlay: boolean; // Render mini audio spectrum on video bottom
  customWatermark: string; // e.g. "@ArtistName" or "Visualizer Studio"
  showTimestamp: boolean;
}

export interface BackgroundLandscape {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  themeMatch: ColorTheme;
  accentColor: string;
}

export interface BackgroundSettings {
  enabled: boolean;
  selectedId: string; // 'none' | 'plasma_peaks' | 'cyber_canyon' | 'solar_horizon' | 'quantum_void'
  opacity: number;    // 0.1 to 1.0
  blur: number;       // 0 to 20 px
  brightness: number; // 0.2 to 1.5
  audioPulse: boolean;
  vignette: boolean;
  scanlines: boolean;
}

export interface CaptureSettings {
  imageFormat: ImageFormat;
  imageQuality: number;
  videoBitrate: VideoBitrate;
  videoFps: VideoFPS;
  videoResolution: VideoResolution;
  aspectRatio: VideoAspectRatio;
  timerMode: RecordTimerMode;
  includeAudio: boolean;
  watermark: WatermarkSettings;
}
