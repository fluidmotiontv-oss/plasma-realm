import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { VisualizerParams, ColorTheme, VisualizerMode, BackgroundSettings } from '../types';
import { audioEngine } from '../audio/AudioEngine';
import { SYNTHWAVE_BACKGROUNDS } from '../data/backgrounds';

interface PlasmaCanvasProps {
  params: VisualizerParams;
  background: BackgroundSettings;
}

export type SparkType = 'explosive_streak' | 'micro_crackle' | 'orbital_ember' | 'lightning_branch';

interface BassSpark {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  hue: number;
  sat: number;
  light: number;
  alpha: number;
  life: number;
  maxLife: number;
  drag: number;
  gravity: number;
  jitter: number;
  type: SparkType;
  trailLength: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  hue: number;
  lineWidth: number;
}

const THEME_PALETTES: Record<ColorTheme, { baseHue: number; secondaryHue: number; accentHue: number; sat: number; light: number }> = {
  cyberpunk: { baseHue: 185, secondaryHue: 320, accentHue: 270, sat: 100, light: 60 },
  solar_flare: { baseHue: 35, secondaryHue: 15, accentHue: 55, sat: 100, light: 55 },
  cosmic_violet: { baseHue: 275, secondaryHue: 220, accentHue: 310, sat: 95, light: 60 },
  bio_emerald: { baseHue: 150, secondaryHue: 110, accentHue: 180, sat: 100, light: 55 },
  hyper_prism: { baseHue: 0, secondaryHue: 120, accentHue: 240, sat: 100, light: 65 },
  cryo_glacial: { baseHue: 195, secondaryHue: 175, accentHue: 225, sat: 90, light: 70 },
  obsidian_lava: { baseHue: 15, secondaryHue: 35, accentHue: 355, sat: 100, light: 50 },
};

export const PlasmaCanvas = forwardRef<HTMLCanvasElement, PlasmaCanvasProps>(function PlasmaCanvas({ params, background }, ref) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  useImperativeHandle(ref, () => internalCanvasRef.current as HTMLCanvasElement);

  // Preload selected background image
  useEffect(() => {
    if (background.enabled && background.selectedId !== 'none') {
      const found = SYNTHWAVE_BACKGROUNDS.find((b) => b.id === background.selectedId);
      if (found) {
        const img = new Image();
        img.src = found.imageUrl;
        img.onload = () => {
          bgImageRef.current = img;
        };
        return;
      }
    }
    bgImageRef.current = null;
  }, [background.enabled, background.selectedId]);

  useEffect(() => {
    const canvas = internalCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let rotationTime = 0;
    let globalHueShift = 0;
    let cameraShakeMagnitude = 0;

    // Bass transient tracking
    let prevBass = 0;
    let prevSubBass = 0;
    let continuousBassTimer = 0;

    // 3D Orbit & Mouse tracking
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      isDown: false,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      rotX: 0,
      rotY: 0,
      targetRotX: 0,
      targetRotY: 0,
      inside: false,
    };

    // Vibrant Bass Spark Particle System
    const sparks: BassSpark[] = [];
    const maxSparks = 750;
    const shockwaves: Shockwave[] = [];

    // Waveform & FFT scratch arrays
    const timeDomainBuffer = new Uint8Array(1024);
    const freqDomainBuffer = new Uint8Array(256);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    // Event Listeners for Mouse & Touch
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.inside = true;

      if (mouse.isDown) {
        const dx = e.clientX - mouse.dragStartX;
        const dy = e.clientY - mouse.dragStartY;
        mouse.targetRotY += dx * 0.005;
        mouse.targetRotX += dy * 0.005;
        mouse.dragStartX = e.clientX;
        mouse.dragStartY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouse.isDown = true;
      mouse.dragStartX = e.clientX;
      mouse.dragStartY = e.clientY;
    };

    const handleMouseUp = () => {
      mouse.isDown = false;
    };

    const handleMouseEnter = () => {
      mouse.inside = true;
    };

    const handleMouseLeave = () => {
      mouse.inside = false;
      mouse.isDown = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.touches[0].clientX - rect.left;
        mouse.targetY = e.touches[0].clientY - rect.top;
        mouse.isDown = true;
        mouse.inside = true;
        mouse.dragStartX = e.touches[0].clientX;
        mouse.dragStartY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.touches[0].clientX - rect.left;
        mouse.targetY = e.touches[0].clientY - rect.top;

        const dx = e.touches[0].clientX - mouse.dragStartX;
        const dy = e.touches[0].clientY - mouse.dragStartY;
        mouse.targetRotY += dx * 0.005;
        mouse.targetRotX += dy * 0.005;
        mouse.dragStartX = e.touches[0].clientX;
        mouse.dragStartY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      mouse.isDown = false;
      mouse.inside = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Helper: Fractal Arc Line Generator
    const drawFractalLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      displace: number,
      minSeg: number,
      bias: number
    ) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);

      if (len < minSeg) {
        ctx.lineTo(x2, y2);
        return;
      }

      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      const offset = (Math.random() - 0.5) * displace;
      let nx = mx - (dy / len) * offset;
      let ny = my + (dx / len) * offset;

      ny -= bias * (Math.random() * displace * 0.25);

      drawFractalLine(x1, y1, nx, ny, displace * 0.5, minSeg, bias);
      drawFractalLine(nx, ny, x2, y2, displace * 0.5, minSeg, bias);
    };

    // --- Vibrant Bass-Synchronized Spark Generator ---
    const spawnBassSparks = (
      originX: number,
      originY: number,
      count: number,
      options: {
        type?: SparkType;
        speed?: number;
        angleMin?: number;
        angleMax?: number;
        baseHue?: number;
        spreadRadius?: number;
        intensity?: number;
      } = {}
    ) => {
      const type = options.type || 'explosive_streak';
      const baseSpeed = options.speed ?? 6;
      const angleMin = options.angleMin ?? 0;
      const angleMax = options.angleMax ?? Math.PI * 2;
      const targetHue = options.baseHue ?? THEME_PALETTES[params.theme].accentHue;
      const spreadRadius = options.spreadRadius ?? 0;
      const intensity = options.intensity ?? 1;

      for (let i = 0; i < count; i++) {
        if (sparks.length >= maxSparks) {
          sparks.shift();
        }

        const angle = angleMin + Math.random() * (angleMax - angleMin);
        const radiusOffset = Math.random() * spreadRadius;
        const startX = originX + Math.cos(angle) * radiusOffset;
        const startY = originY + Math.sin(angle) * radiusOffset;

        let speed = (Math.random() * 0.8 + 0.6) * baseSpeed * intensity;
        let size = Math.random() * 2.5 + 1.2;
        let maxLife = Math.random() * 30 + 20;
        let drag = 0.95;
        let gravity = 0;
        let jitter = 0.4;
        let sparkHue = targetHue + (Math.random() - 0.5) * 35;
        let sat = 100;
        let light = 70;

        if (type === 'explosive_streak') {
          speed = (Math.random() * 6 + 4) * baseSpeed * 0.25 * intensity;
          size = Math.random() * 3 + 1.8;
          maxLife = Math.random() * 25 + 18;
          drag = 0.93;
          gravity = 0.08;
          jitter = 0.6;
          light = 80;
        } else if (type === 'micro_crackle') {
          speed = (Math.random() * 4 + 1.5) * intensity;
          size = Math.random() * 1.8 + 0.8;
          maxLife = Math.random() * 18 + 12;
          drag = 0.91;
          jitter = 1.4;
          light = 85;
        } else if (type === 'orbital_ember') {
          speed = (Math.random() * 2.5 + 1) * intensity;
          size = Math.random() * 2.4 + 1.2;
          maxLife = Math.random() * 60 + 40;
          drag = 0.98;
          jitter = 0.3;
          gravity = -0.04;
        } else if (type === 'lightning_branch') {
          speed = (Math.random() * 8 + 3) * intensity;
          size = Math.random() * 2.5 + 1.5;
          maxLife = Math.random() * 20 + 10;
          drag = 0.92;
          jitter = 2.0;
          light = 90;
        }

        const vx = Math.cos(angle) * speed + (Math.random() - 0.5) * jitter;
        const vy = Math.sin(angle) * speed + (Math.random() - 0.5) * jitter;
        const vz = (Math.random() - 0.5) * 4;

        sparks.push({
          x: startX,
          y: startY,
          z: Math.random() * 300 - 150,
          prevX: startX,
          prevY: startY,
          vx,
          vy,
          vz,
          size,
          hue: (sparkHue + 360) % 360,
          sat,
          light,
          alpha: 1,
          life: 0,
          maxLife,
          drag,
          gravity,
          jitter,
          type,
          trailLength: type === 'explosive_streak' ? 4 : 2,
        });
      }
    };

    // --- Main Render Loop ---
    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const minDimension = Math.min(w, h);

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.2;
      mouse.y += (mouse.targetY - mouse.y) * 0.2;
      mouse.rotX += (mouse.targetRotX - mouse.rotX) * 0.08;
      mouse.rotY += (mouse.targetRotY - mouse.rotY) * 0.08;

      // Real-time Audio Analysis
      const audioAnalysis = audioEngine.analyze();
      const { subBass, bass, mid, high, treble, isBeat, beatIntensity } = audioAnalysis;

      const bassEnergy = (subBass * 1.5 + bass) * 0.5 * params.bassReactivity;
      const bassDelta = Math.max(0, bassEnergy - prevBass);
      const subBassDelta = Math.max(0, subBass - prevSubBass);
      prevBass = bassEnergy;
      prevSubBass = subBass;

      // Color Hue Shift & Palette calculation
      const palette = THEME_PALETTES[params.theme];
      if (params.theme === 'hyper_prism') {
        globalHueShift = (globalHueShift + 0.8 + audioAnalysis.overallAmp * 4) % 360;
      } else {
        globalHueShift = 0;
      }
      const activeBaseHue = (palette.baseHue + globalHueShift) % 360;
      const activeSecondaryHue = (palette.secondaryHue + globalHueShift) % 360;
      const activeAccentHue = (palette.accentHue + globalHueShift) % 360;

      // =========================================================================
      // BASS-SYNCHRONIZED SPARK INJECTION ENGINE
      // =========================================================================

      // 1. Heavy Bass Transient / 808 Drop Ejection
      if ((isBeat && beatIntensity > 0.35) || bassDelta > 0.16 || subBass > 0.65) {
        const dropPower = Math.max(beatIntensity, bassDelta * 3, subBass);
        
        if (params.cameraShake) {
          cameraShakeMagnitude = dropPower * 14;
        }

        shockwaves.push({
          x: w / 2,
          y: h / 2,
          radius: minDimension * 0.08,
          maxRadius: minDimension * 0.58 * (1 + dropPower * 0.35),
          alpha: 0.95,
          hue: activeBaseHue,
          lineWidth: 4 + dropPower * 7,
        });

        // Radial explosive streak spark burst
        const burstCount = Math.min(65, Math.floor(25 * dropPower * (params.particleCount / 100)));
        spawnBassSparks(w / 2, h / 2, burstCount, {
          type: 'explosive_streak',
          speed: 8 + dropPower * 10,
          baseHue: activeAccentHue,
          spreadRadius: minDimension * 0.05,
          intensity: 1 + bassEnergy * 0.6,
        });

        // Crackle micro-sparks on the perimeter
        spawnBassSparks(w / 2, h / 2, Math.floor(burstCount * 0.6), {
          type: 'micro_crackle',
          speed: 5 + dropPower * 6,
          baseHue: activeSecondaryHue,
          spreadRadius: minDimension * 0.12,
          intensity: 1.2,
        });
      }

      // 2. Continuous Sub-Bass Flow & Rolling Bassline Sparks
      continuousBassTimer++;
      if (continuousBassTimer % 2 === 0 && bassEnergy > 0.15) {
        const streamCount = Math.max(1, Math.floor(bassEnergy * 4 * (params.particleCount / 150)));
        
        // Erupt radiant plasma sparks from the center
        spawnBassSparks(w / 2, h / 2, streamCount, {
          type: Math.random() < 0.6 ? 'orbital_ember' : 'micro_crackle',
          speed: 3 + bassEnergy * 5,
          baseHue: Math.random() < 0.5 ? activeBaseHue : activeAccentHue,
          spreadRadius: minDimension * 0.08 * (1 + subBass * 0.4),
          intensity: 0.8 + bassEnergy * 0.5,
        });
      }

      // 3. Interactive Touch / Mouse Lightning Sparks
      if (mouse.inside && (mouse.isDown || bassEnergy > 0.25)) {
        const touchSparks = Math.floor((mouse.isDown ? 4 : 2) + bassEnergy * 4);
        spawnBassSparks(mouse.x, mouse.y, touchSparks, {
          type: 'lightning_branch',
          speed: 4 + bassEnergy * 6,
          baseHue: activeAccentHue,
          spreadRadius: 15 + bassEnergy * 25,
          intensity: 1.4,
        });
      }

      // Camera Shake decay
      let shakeX = 0;
      let shakeY = 0;
      if (cameraShakeMagnitude > 0.1) {
        shakeX = (Math.random() - 0.5) * cameraShakeMagnitude;
        shakeY = (Math.random() - 0.5) * cameraShakeMagnitude;
        cameraShakeMagnitude *= 0.88;
      }

      // Background Fade & Layer Compositing
      ctx.save();
      ctx.translate(shakeX, shakeY);

      if (bgImageRef.current && background.enabled && background.selectedId !== 'none') {
        const img = bgImageRef.current;
        const pulseScale = (background.audioPulse && isBeat) ? (1 + beatIntensity * 0.035) : 1;

        // Draw background landscape onto canvas for snapshot/recording fidelity
        ctx.save();
        ctx.globalAlpha = background.opacity * 0.85;

        const hRatio = w / img.width;
        const vRatio = h / img.height;
        const ratio = Math.max(hRatio, vRatio) * pulseScale;
        const nw = img.width * ratio;
        const nh = img.height * ratio;
        const nx = (w - nw) / 2;
        const ny = (h - nh) / 2;

        ctx.drawImage(img, nx, ny, nw, nh);
        ctx.restore();

        // Dark atmosphere wash to keep plasma laser arcs high contrast
        const washOpacity = Math.max(0.18, 1 - background.opacity * 0.7);
        ctx.fillStyle = `rgba(2, 2, 6, ${washOpacity})`;
        ctx.fillRect(-20, -20, w + 40, h + 40);

        // Visualizer trail clear
        const trailAlpha = params.mode === 'vector_ribbon' ? 0.22 : 0.18;
        ctx.fillStyle = `rgba(3, 3, 7, ${trailAlpha})`;
        ctx.fillRect(-20, -20, w + 40, h + 40);

        if (background.vignette) {
          const vigGrad = ctx.createRadialGradient(w / 2, h / 2, minDimension * 0.35, w / 2, h / 2, minDimension * 0.95);
          vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
          vigGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
          ctx.fillStyle = vigGrad;
          ctx.fillRect(0, 0, w, h);
        }

        if (background.scanlines) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
          for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 1.5);
          }
        }
      } else {
        const bgAlpha = params.mode === 'vector_ribbon' ? 0.2 : 0.18;
        ctx.fillStyle = `rgba(3, 3, 7, ${bgAlpha})`;
        ctx.fillRect(-20, -20, w + 40, h + 40);
      }

      if (params.beatFlash && isBeat && beatIntensity > 0.6) {
        const flashGradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, minDimension * 0.6);
        flashGradient.addColorStop(0, `hsla(${activeAccentHue}, 100%, 65%, ${beatIntensity * 0.18})`);
        flashGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flashGradient;
        ctx.fillRect(0, 0, w, h);
      }

      rotationTime += (params.speed * 0.005) * (1 + mid * 0.8);

      // --- VISUALIZER MODES ---

      if (params.mode === 'plasma_orb') {
        renderPlasmaOrb(
          ctx,
          w,
          h,
          minDimension,
          audioAnalysis,
          activeBaseHue,
          activeSecondaryHue,
          activeAccentHue,
          palette,
          rotationTime,
          mouse,
          spawnBassSparks
        );
      } else if (params.mode === 'radial_spectrum') {
        renderRadialSpectrum(
          ctx,
          w,
          h,
          minDimension,
          audioAnalysis,
          activeBaseHue,
          activeSecondaryHue,
          activeAccentHue,
          rotationTime,
          spawnBassSparks
        );
      } else if (params.mode === 'cosmic_nebula') {
        renderCosmicNebula(
          ctx,
          w,
          h,
          minDimension,
          audioAnalysis,
          activeBaseHue,
          activeSecondaryHue,
          activeAccentHue,
          rotationTime,
          spawnBassSparks
        );
      } else if (params.mode === 'lightning_matrix') {
        renderLightningMatrix(
          ctx,
          w,
          h,
          minDimension,
          audioAnalysis,
          activeBaseHue,
          activeAccentHue,
          rotationTime,
          spawnBassSparks
        );
      } else if (params.mode === 'vector_ribbon') {
        renderVectorRibbon(
          ctx,
          w,
          h,
          minDimension,
          audioAnalysis,
          activeBaseHue,
          activeSecondaryHue,
          activeAccentHue,
          rotationTime,
          timeDomainBuffer,
          spawnBassSparks
        );
      }

      // --- SHOCKWAVE RINGS ---
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.12 + 2;
        sw.alpha *= 0.93;

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${sw.hue}, 100%, 65%, ${sw.alpha * params.shockwaveIntensity})`;
        ctx.lineWidth = sw.lineWidth * sw.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsl(${sw.hue}, 100%, 50%)`;
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (sw.alpha < 0.02 || sw.radius >= sw.maxRadius * 0.98) {
          shockwaves.splice(i, 1);
        }
      }

      // =========================================================================
      // VIBRANT SPARK RENDERING & PHYSICS INTEGRATION
      // =========================================================================
      ctx.save();
      ctx.globalCompositeOperation = 'lighter'; // Additive blending for electric plasma luminosity

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        
        s.prevX = s.x;
        s.prevY = s.y;

        // Apply physics
        s.vx *= s.drag;
        s.vy *= s.drag;
        s.vy += s.gravity;

        // Electrical jitter
        s.x += s.vx + (Math.random() - 0.5) * s.jitter;
        s.y += s.vy + (Math.random() - 0.5) * s.jitter;
        s.z += s.vz;

        s.life++;
        s.alpha = Math.max(0, 1 - (s.life / s.maxLife));

        // 3D perspective scale calculation
        const perspective = 300 / Math.max(50, 300 + s.z);
        const curScreenX = w / 2 + (s.x - w / 2) * perspective;
        const curScreenY = h / 2 + (s.y - h / 2) * perspective;
        const prevScreenX = w / 2 + (s.prevX - w / 2) * perspective;
        const prevScreenY = h / 2 + (s.prevY - h / 2) * perspective;

        const renderedSize = Math.max(0.7, s.size * perspective * (1 + bassEnergy * 0.3));

        // 1. Render Motion Streak Trail
        ctx.beginPath();
        ctx.moveTo(prevScreenX, prevScreenY);
        ctx.lineTo(curScreenX, curScreenY);
        ctx.strokeStyle = `hsla(${s.hue}, ${s.sat}%, ${s.light}%, ${s.alpha * 0.9})`;
        ctx.lineWidth = renderedSize * 1.4;
        ctx.shadowBlur = params.glow * 0.4 + (s.type === 'explosive_streak' ? 12 : 6);
        ctx.shadowColor = `hsl(${s.hue}, 100%, 60%)`;
        ctx.stroke();

        // 2. Render Radiant White-Hot Spark Core Point
        ctx.beginPath();
        ctx.arc(curScreenX, curScreenY, renderedSize * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = s.type === 'explosive_streak' ? '#ffffff' : `hsla(${s.hue}, 100%, 90%, ${s.alpha})`;
        ctx.fill();

        // 3. Sub-bass flash halo on energetic sparks
        if (s.type === 'explosive_streak' && s.life < 8) {
          ctx.beginPath();
          ctx.arc(curScreenX, curScreenY, renderedSize * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue}, 100%, 75%, ${s.alpha * 0.3})`;
          ctx.fill();
        }

        // Clean up expired sparks
        if (s.life >= s.maxLife || s.alpha <= 0.01) {
          sparks.splice(i, 1);
        }
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    // --- MODE RENDERERS ---

    const renderPlasmaOrb = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      minDim: number,
      audio: any,
      baseHue: number,
      secHue: number,
      accHue: number,
      palette: any,
      time: number,
      m: any,
      spawnSparksFn: (x: number, y: number, count: number, opts: any) => void
    ) => {
      const cx = w / 2;
      const cy = h / 2;

      const sphereRadius = minDim * 0.38 + (audio.subBass * 40 * params.bassReactivity);
      const coreRadius = minDim * 0.07 + (audio.subBass * 55 * params.bassReactivity);

      // Outer glass sphere aura
      const auraGradient = c.createRadialGradient(cx, cy, sphereRadius * 0.8, cx, cy, sphereRadius * 1.08);
      auraGradient.addColorStop(0, 'rgba(0,0,0,0)');
      auraGradient.addColorStop(0.8, `hsla(${baseHue}, 80%, 40%, 0.12)`);
      auraGradient.addColorStop(1, `hsla(${accHue}, 90%, 60%, 0.25)`);
      c.fillStyle = auraGradient;
      c.beginPath();
      c.arc(cx, cy, sphereRadius * 1.08, 0, Math.PI * 2);
      c.fill();

      // Outer glass boundary ring with chromatic rim
      c.beginPath();
      c.arc(cx, cy, sphereRadius, 0, Math.PI * 2);
      c.strokeStyle = `hsla(${baseHue}, 70%, 30%, 0.65)`;
      c.lineWidth = 2.5;
      c.stroke();

      // Glass specular reflection highlight
      c.beginPath();
      c.ellipse(cx - sphereRadius * 0.35, cy - sphereRadius * 0.35, sphereRadius * 0.35, sphereRadius * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      c.lineWidth = 2;
      c.stroke();

      // 3D Orbital Tesla Rings
      const ringCount = 2;
      for (let r = 0; r < ringCount; r++) {
        const ringAngle = time * (r === 0 ? 0.8 : -0.6) + m.rotY;
        const ringTilt = (r === 0 ? 0.45 : -0.35) + m.rotX * 0.5;
        const ringRadius = sphereRadius * (1.12 + r * 0.15);

        c.beginPath();
        c.ellipse(cx, cy, ringRadius, ringRadius * Math.abs(Math.cos(ringTilt)), ringAngle, 0, Math.PI * 2);
        c.strokeStyle = `hsla(${r === 0 ? secHue : accHue}, 85%, 55%, ${0.2 + audio.high * 0.4})`;
        c.lineWidth = 1.5 + audio.treble * 3;
        c.shadowBlur = 10;
        c.shadowColor = `hsl(${accHue}, 100%, 50%)`;
        c.stroke();
        c.shadowBlur = 0;
      }

      // Central Fusion Core
      const coreGradient = c.createRadialGradient(cx, cy, 0, cx, cy, coreRadius * 1.6);
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.3, `hsla(${baseHue}, 100%, 80%, 0.95)`);
      coreGradient.addColorStop(0.7, `hsla(${secHue}, 100%, 60%, 0.6)`);
      coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      c.beginPath();
      c.arc(cx, cy, coreRadius * 1.6, 0, Math.PI * 2);
      c.fillStyle = coreGradient;
      c.shadowBlur = params.glow * 1.5 + (audio.subBass * 45);
      c.shadowColor = `hsl(${baseHue}, 100%, 60%)`;
      c.fill();
      c.shadowBlur = 0;

      // Dynamic Arc Count modulated by audio mids & parameters
      const totalArcs = Math.max(
        4,
        Math.floor(params.arcs * (0.6 + audio.lowMid * 0.9 + audio.subBass * 0.4))
      );

      for (let i = 0; i < totalArcs; i++) {
        const baseAngle = (i * (Math.PI * 2) / totalArcs) + time * (params.emfSpiral ? 2.5 : 0.8);

        let targetX: number;
        let targetY: number;
        let isTouchLock = false;

        if (m.inside && (m.isDown || Math.random() < 0.65)) {
          const mouseDx = m.x - cx;
          const mouseDy = m.y - cy;
          const targetAngle = Math.atan2(mouseDy, mouseDx);
          const spread = (Math.random() - 0.5) * (0.2 + (1 - audio.overallAmp) * 0.2);

          targetX = cx + sphereRadius * Math.cos(targetAngle + spread);
          targetY = cy + sphereRadius * Math.sin(targetAngle + spread);
          isTouchLock = true;
        } else {
          targetX = cx + sphereRadius * Math.cos(baseAngle);
          targetY = cy + sphereRadius * Math.sin(baseAngle);
        }

        const startX = cx + coreRadius * Math.cos(baseAngle);
        const startY = cy + coreRadius * Math.sin(baseAngle);

        c.beginPath();
        c.moveTo(startX, startY);

        const minSeg = Math.max(2, 12 - params.complexity);
        const displace = params.displacement * (1 + audio.bass * 0.6);

        if (params.emfSpiral) {
          const steps = 14;
          for (let j = 1; j <= steps; j++) {
            const t = j / steps;
            let lx = startX + (targetX - startX) * t;
            let ly = startY + (targetY - startY) * t;

            const spiralRadius = Math.sin(t * Math.PI) * (30 + audio.bass * 25) * Math.cos(time * 2);
            const curAngle = Math.atan2(ly - cy, lx - cx) + (t * 0.7);
            const distFromCenter = Math.hypot(lx - cx, ly - cy);

            lx = cx + distFromCenter * Math.cos(curAngle);
            ly = cy + distFromCenter * Math.sin(curAngle);

            lx += (Math.random() - 0.5) * 8;
            ly += (Math.random() - 0.5) * 8;

            c.lineTo(lx, ly);
          }
        } else {
          drawFractalLine(startX, startY, targetX, targetY, displace, minSeg, 0.4);
        }

        const filamentHue = (baseHue + (i * 360 / totalArcs) * 0.3) % 360;

        // Glowing outer stroke
        c.strokeStyle = `hsla(${filamentHue}, ${palette.sat}%, ${palette.light}%, ${0.4 + audio.high * 0.4})`;
        c.lineWidth = (params.width * (isTouchLock ? 2.2 : 1.4)) + (audio.bass * 3.5 * params.bassReactivity);
        c.shadowBlur = params.glow + (audio.overallAmp * 20);
        c.shadowColor = `hsl(${filamentHue}, 100%, 55%)`;
        c.stroke();

        // Bright white hot core stroke
        c.strokeStyle = '#ffffff';
        c.lineWidth = params.width * 0.4 + (audio.treble * 1.5);
        c.shadowBlur = 0;
        c.stroke();

        // Contact Spark Node
        c.fillStyle = `hsl(${filamentHue}, 100%, 75%)`;
        c.beginPath();
        c.arc(targetX, targetY, (isTouchLock ? 4 : 2) + Math.random() * 3 + (audio.treble * 4), 0, Math.PI * 2);
        c.fill();

        // Bass spark emission from perimeter contact points
        if (audio.subBass > 0.45 && Math.random() < 0.25) {
          spawnSparksFn(targetX, targetY, 2, {
            type: 'micro_crackle',
            speed: 3 + audio.subBass * 4,
            baseHue: filamentHue,
            intensity: 1.2,
          });
        }
      }
    };

    const renderRadialSpectrum = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      minDim: number,
      audio: any,
      baseHue: number,
      secHue: number,
      accHue: number,
      time: number,
      spawnSparksFn: (x: number, y: number, count: number, opts: any) => void
    ) => {
      const cx = w / 2;
      const cy = h / 2;
      const innerRadius = minDim * 0.12 + (audio.subBass * 35);
      const maxBarLength = minDim * 0.32;

      audioEngine.getFrequencyData(freqDomainBuffer);
      const bars = 96;

      // Pulsing center mandala
      c.beginPath();
      c.arc(cx, cy, innerRadius, 0, Math.PI * 2);
      c.fillStyle = `hsla(${baseHue}, 100%, 50%, 0.15)`;
      c.strokeStyle = `hsla(${accHue}, 100%, 70%, 0.8)`;
      c.lineWidth = 3 + audio.subBass * 4;
      c.shadowBlur = 20;
      c.shadowColor = `hsl(${accHue}, 100%, 60%)`;
      c.fill();
      c.stroke();
      c.shadowBlur = 0;

      for (let i = 0; i < bars; i++) {
        const angle = (i * Math.PI * 2 / bars) + time * 0.4;
        const binIndex = Math.floor((i / bars) * (freqDomainBuffer.length * 0.6));
        const val = freqDomainBuffer[binIndex] / 255;
        const barLen = val * maxBarLength * (1 + audio.overallAmp * 0.5);

        const x1 = cx + innerRadius * Math.cos(angle);
        const y1 = cy + innerRadius * Math.sin(angle);
        const x2 = cx + (innerRadius + barLen) * Math.cos(angle);
        const y2 = cy + (innerRadius + barLen) * Math.sin(angle);

        const hue = (baseHue + (i / bars) * 160) % 360;

        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.strokeStyle = `hsla(${hue}, 100%, 60%, 0.75)`;
        c.lineWidth = 2.5 + val * 4;
        c.shadowBlur = 12;
        c.shadowColor = `hsl(${hue}, 100%, 50%)`;
        c.stroke();

        // Tip Particle & Bass Spark Emission from low-frequency bars
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(x2, y2, 2 + val * 3, 0, Math.PI * 2);
        c.fill();

        if (i < 20 && val > 0.6 && audio.subBass > 0.4 && Math.random() < 0.3) {
          spawnSparksFn(x2, y2, 2, {
            type: 'explosive_streak',
            speed: 4 + val * 5,
            angleMin: angle - 0.4,
            angleMax: angle + 0.4,
            baseHue: hue,
            intensity: 1.3,
          });
        }
      }
      c.shadowBlur = 0;
    };

    const renderCosmicNebula = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      minDim: number,
      audio: any,
      baseHue: number,
      secHue: number,
      accHue: number,
      time: number,
      spawnSparksFn: (x: number, y: number, count: number, opts: any) => void
    ) => {
      const cx = w / 2;
      const cy = h / 2;
      const count = 120;

      // Central gravity vortex
      const vortexGrad = c.createRadialGradient(cx, cy, 0, cx, cy, minDim * 0.4);
      vortexGrad.addColorStop(0, `hsla(${accHue}, 100%, 75%, 0.8)`);
      vortexGrad.addColorStop(0.2, `hsla(${baseHue}, 90%, 50%, 0.4)`);
      vortexGrad.addColorStop(0.6, `hsla(${secHue}, 100%, 30%, 0.15)`);
      vortexGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = vortexGrad;
      c.fillRect(0, 0, w, h);

      // Galaxy Spiral Arms
      const arms = 3;
      for (let a = 0; a < arms; a++) {
        const armOffset = (a * Math.PI * 2) / arms;
        c.beginPath();
        for (let i = 0; i < count; i++) {
          const t = i / count;
          const r = t * minDim * 0.45 * (1 + audio.subBass * 0.3);
          const theta = armOffset + t * 6 + time * 1.2;
          const x = cx + r * Math.cos(theta);
          const y = cy + r * Math.sin(theta);

          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);

          // Sub-bass spiral vortex spark emission
          if (i % 30 === 0 && audio.subBass > 0.4 && Math.random() < 0.25) {
            spawnSparksFn(x, y, 2, {
              type: 'orbital_ember',
              speed: 2 + audio.subBass * 4,
              baseHue: baseHue + a * 40,
              intensity: 1.1,
            });
          }
        }
        c.strokeStyle = `hsla(${baseHue + a * 40}, 100%, 65%, 0.4)`;
        c.lineWidth = 2 + audio.high * 4;
        c.shadowBlur = 15;
        c.shadowColor = `hsl(${baseHue}, 100%, 50%)`;
        c.stroke();
      }
      c.shadowBlur = 0;
    };

    const renderLightningMatrix = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      minDim: number,
      audio: any,
      baseHue: number,
      accHue: number,
      time: number,
      spawnSparksFn: (x: number, y: number, count: number, opts: any) => void
    ) => {
      const cx = w / 2;
      const horizonY = h * 0.65;

      // Perspective Grid Floor
      c.strokeStyle = `hsla(${baseHue}, 80%, 40%, 0.25)`;
      c.lineWidth = 1;

      // Horizontal lines
      for (let y = horizonY; y < h; y += (y - horizonY) * 0.25 + 12) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }

      // Vertical perspective lines
      for (let x = -w * 0.5; x <= w * 1.5; x += w * 0.1) {
        c.beginPath();
        c.moveTo(cx, horizonY);
        c.lineTo(x, h);
        c.stroke();
      }

      // Towering central lightning pillar
      const bolts = 4 + Math.floor(audio.bass * 6);
      for (let b = 0; b < bolts; b++) {
        const startX = cx + (Math.random() - 0.5) * 80;
        const startY = h * 0.05;
        const endX = cx + (Math.random() - 0.5) * w * 0.8;
        const endY = horizonY + Math.random() * (h - horizonY);

        c.beginPath();
        c.moveTo(startX, startY);
        drawFractalLine(startX, startY, endX, endY, 60 * (1 + audio.bass), 4, 0);

        c.strokeStyle = `hsla(${accHue}, 100%, 65%, ${0.6 + audio.treble * 0.4})`;
        c.lineWidth = 2 + audio.bass * 3;
        c.shadowBlur = 20;
        c.shadowColor = `hsl(${accHue}, 100%, 60%)`;
        c.stroke();

        c.strokeStyle = '#ffffff';
        c.lineWidth = 1;
        c.stroke();

        // Spark explosion on ground impact
        if (audio.subBass > 0.35 && Math.random() < 0.4) {
          spawnSparksFn(endX, endY, 3, {
            type: 'lightning_branch',
            speed: 5 + audio.subBass * 5,
            angleMin: -Math.PI,
            angleMax: 0, // blast upwards from ground
            baseHue: accHue,
            intensity: 1.3,
          });
        }
      }
      c.shadowBlur = 0;
    };

    const renderVectorRibbon = (
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      minDim: number,
      audio: any,
      baseHue: number,
      secHue: number,
      accHue: number,
      time: number,
      timeBuff: Uint8Array,
      spawnSparksFn: (x: number, y: number, count: number, opts: any) => void
    ) => {
      audioEngine.getTimeDomainData(timeBuff);
      const layers = 4;

      for (let l = 0; l < layers; l++) {
        const layerY = (h / 2) + (l - layers / 2 + 0.5) * 50;
        const hue = (baseHue + l * 40 + time * 30) % 360;

        c.beginPath();
        const sliceWidth = w / timeBuff.length;
        let x = 0;

        for (let i = 0; i < timeBuff.length; i++) {
          const v = (timeBuff[i] - 128) / 128; // -1 to 1
          const y = layerY + v * (minDim * 0.22) * (1 + audio.subBass * 0.6) * Math.sin(i * 0.02 + time * (l + 1));

          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);

          // Waveform peak spark spray on heavy sub-bass
          if (i % 64 === 0 && Math.abs(v) > 0.65 && audio.subBass > 0.4 && Math.random() < 0.3) {
            spawnSparksFn(x, y, 2, {
              type: 'explosive_streak',
              speed: 4 + audio.subBass * 5,
              baseHue: hue,
              intensity: 1.1,
            });
          }

          x += sliceWidth;
        }

        c.strokeStyle = `hsla(${hue}, 100%, 60%, 0.7)`;
        c.lineWidth = 2.5 + audio.bass * 3;
        c.shadowBlur = 18;
        c.shadowColor = `hsl(${hue}, 100%, 50%)`;
        c.stroke();
      }
      c.shadowBlur = 0;
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };
  }, [params, background]);

  return (
    <canvas
      ref={internalCanvasRef}
      className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none z-10"
      style={{ background: 'transparent' }}
    />
  );
});
