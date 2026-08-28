import bgPeaks from '../assets/images/synthwave_plasma_peaks_1787841029724.jpg';
import bgCanyon from '../assets/images/cyber_plasma_canyon_1787841047201.jpg';
import bgSolar from '../assets/images/solar_plasma_horizon_1787841062268.jpg';
import bgVoid from '../assets/images/quantum_plasma_void_1787841075441.jpg';
import { BackgroundLandscape } from '../types';

export const SYNTHWAVE_BACKGROUNDS: BackgroundLandscape[] = [
  {
    id: 'plasma_peaks',
    name: 'Neon Violet Peaks',
    subtitle: 'Ionized Mountain Ridges & Aurora',
    description: 'Electric magenta & violet plasma clouds rolling over stylized wireframe ridges under cosmic synth auroras.',
    imageUrl: bgPeaks,
    themeMatch: 'cosmic_violet',
    accentColor: '#a855f7',
  },
  {
    id: 'cyber_canyon',
    name: 'Cyber Turquoise Chasm',
    subtitle: 'Crystalline Energy River & Grid',
    description: 'Bioluminescent cyan plasma rivers coursing through neon chasms with floating ionized energy orbs.',
    imageUrl: bgCanyon,
    themeMatch: 'cyberpunk',
    accentColor: '#06b6d4',
  },
  {
    id: 'solar_horizon',
    name: 'Solar Flare Horizon',
    subtitle: 'Coronal Arches & Amber Ocean',
    description: 'Radiant amber, gold, and crimson solar flares erupting over a retro-synthwave twilight sea horizon.',
    imageUrl: bgSolar,
    themeMatch: 'solar_flare',
    accentColor: '#f59e0b',
  },
  {
    id: 'quantum_void',
    name: 'Quantum Dusk Void',
    subtitle: 'Ultraviolet Filaments & Mirrored Realm',
    description: 'Ethereal cosmic ultraviolet filaments weaving across an infinite mirrored planar landscape with stardust clouds.',
    imageUrl: bgVoid,
    themeMatch: 'cryo_glacial',
    accentColor: '#8b5cf6',
  },
];
