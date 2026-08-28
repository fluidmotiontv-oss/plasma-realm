import React, { useEffect, useState } from 'react';
import { BackgroundSettings } from '../types';
import { SYNTHWAVE_BACKGROUNDS } from '../data/backgrounds';
import { audioEngine } from '../audio/AudioEngine';

interface StaticBackgroundLayerProps {
  background: BackgroundSettings;
}

export const StaticBackgroundLayer: React.FC<StaticBackgroundLayerProps> = ({ background }) => {
  const [pulseScale, setPulseScale] = useState(1);
  const [pulseBrightness, setPulseBrightness] = useState(1);

  const selectedBg = SYNTHWAVE_BACKGROUNDS.find((b) => b.id === background.selectedId);

  // Audio Beat Pulse Listener
  useEffect(() => {
    if (!background.enabled || !background.audioPulse || !selectedBg) {
      setPulseScale(1);
      setPulseBrightness(1);
      return;
    }

    let animId: number;
    const checkBeat = () => {
      const analysis = audioEngine.analyze();
      if (analysis.isBeat && analysis.beatIntensity > 0.4) {
        setPulseScale(1 + analysis.beatIntensity * 0.035);
        setPulseBrightness(1 + analysis.beatIntensity * 0.2);
      } else {
        setPulseScale((prev) => 1 + (prev - 1) * 0.88);
        setPulseBrightness((prev) => 1 + (prev - 1) * 0.88);
      }
      animId = requestAnimationFrame(checkBeat);
    };

    animId = requestAnimationFrame(checkBeat);
    return () => cancelAnimationFrame(animId);
  }, [background.enabled, background.audioPulse, selectedBg]);

  if (!background.enabled || !selectedBg) {
    return (
      <div
        id="static-bg-layer"
        className="absolute inset-0 bg-[#020204] pointer-events-none transition-colors duration-700"
      />
    );
  }

  return (
    <div id="static-bg-layer" className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Background Image with CSS Filters & Audio Pulse */}
      <img
        src={selectedBg.imageUrl}
        alt={selectedBg.name}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-100 ease-out will-change-transform"
        style={{
          opacity: background.opacity,
          filter: `blur(${background.blur}px) brightness(${background.brightness * pulseBrightness})`,
          transform: `scale(${pulseScale})`,
        }}
      />

      {/* Atmospheric Dark Tint Layer to make visualizer arcs and sparks pop */}
      <div
        className="absolute inset-0 bg-[#020204]/40 backdrop-contrast-125 transition-opacity duration-300"
        style={{ opacity: Math.max(0.2, 1 - background.opacity * 0.7) }}
      />

      {/* Cinematic Vignette Overlay */}
      {background.vignette && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
      )}

      {/* Retro Synthwave Scanlines */}
      {background.scanlines && (
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.25)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
      )}
    </div>
  );
};
