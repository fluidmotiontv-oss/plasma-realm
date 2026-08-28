import { audioEngine } from '../audio';
import { CaptureSettings, ImageFormat, VideoBitrate, VideoFPS, VideoAspectRatio, WatermarkSettings } from '../types';

export function getSupportedMimeType(includeAudio: boolean): string {
  const types = includeAudio
    ? [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4',
      ]
    : [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm;codecs=h264',
        'video/webm',
        'video/mp4',
      ];

  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'video/webm';
}

export function takeCanvasSnapshot(
  canvas: HTMLCanvasElement,
  format: ImageFormat = 'png',
  quality = 0.95,
  titleInfo?: { title?: string; artist?: string; customWatermark?: string }
): string {
  // Create an offscreen canvas to optionally burn in metadata if requested
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');

  if (ctx) {
    ctx.drawImage(canvas, 0, 0);

    // If title info or watermark is provided
    if (titleInfo?.title || titleInfo?.customWatermark) {
      ctx.save();
      const margin = Math.max(20, canvas.width * 0.02);
      ctx.font = '600 16px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;

      if (titleInfo.title) {
        ctx.fillText(`${titleInfo.title} • ${titleInfo.artist || 'D9 Plasma'}`, margin, canvas.height - margin);
      }
      if (titleInfo.customWatermark) {
        const textWidth = ctx.measureText(titleInfo.customWatermark).width;
        ctx.fillText(titleInfo.customWatermark, canvas.width - textWidth - margin, canvas.height - margin);
      }
      ctx.restore();
    }
  }

  const targetCanvas = ctx ? exportCanvas : canvas;
  const mimeType =
    format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const dataUrl = targetCanvas.toDataURL(mimeType, quality);

  const date = new Date();
  const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `plasma-snapshot-${dateStr}.${format}`;

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

export interface RecorderStartOptions {
  fps: VideoFPS;
  bitrate: VideoBitrate;
  includeAudio: boolean;
  maxDurationSeconds?: number;
  aspectRatio?: VideoAspectRatio;
  watermark?: WatermarkSettings;
  trackTitle?: string;
  trackArtist?: string;
}

export class CanvasVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private recordingStartTime = 0;
  private timerInterval: number | null = null;
  private maxDurationTimer: number | null = null;
  private onTimeUpdateCallback?: (seconds: number) => void;
  private onStatusChangeCallback?: (isRecording: boolean) => void;
  public isRecording = false;

  constructor(
    onTimeUpdate?: (seconds: number) => void,
    onStatusChange?: (isRecording: boolean) => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onStatusChangeCallback = onStatusChange;
  }

  public start(
    canvas: HTMLCanvasElement,
    settings: RecorderStartOptions
  ): boolean {
    if (this.isRecording) return false;

    try {
      this.recordedChunks = [];
      const canvasStream = canvas.captureStream(settings.fps || 60);

      const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      if (settings.includeAudio) {
        const audioTracks = audioEngine.getAudioStreamTracks();
        if (audioTracks.length > 0) {
          combinedTracks.push(...audioTracks);
        }
      }

      const combinedStream = new MediaStream(combinedTracks);
      const mimeType = getSupportedMimeType(
        settings.includeAudio && combinedTracks.some((t) => t.kind === 'audio')
      );

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: settings.bitrate || 15000000,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finishAndDownload(mimeType, settings.trackTitle);
      };

      this.mediaRecorder.start(1000);
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(true);
      }

      this.timerInterval = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        if (this.onTimeUpdateCallback) {
          this.onTimeUpdateCallback(elapsed);
        }
      }, 250);

      // Auto-stop timer if configured
      if (settings.maxDurationSeconds && settings.maxDurationSeconds > 0) {
        this.maxDurationTimer = window.setTimeout(() => {
          if (this.isRecording) {
            this.stop();
          }
        }, settings.maxDurationSeconds * 1000);
      }

      return true;
    } catch (err) {
      console.error('Failed to start video recording:', err);
      this.isRecording = false;
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(false);
      }
      return false;
    }
  }

  public stop() {
    if (!this.isRecording || !this.mediaRecorder) return;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.maxDurationTimer) {
      clearTimeout(this.maxDurationTimer);
      this.maxDurationTimer = null;
    }

    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.isRecording = false;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(false);
    }
  }

  private finishAndDownload(mimeType: string, trackTitle?: string) {
    if (this.recordedChunks.length === 0) return;

    const blob = new Blob(this.recordedChunks, { type: mimeType });
    const isMp4 = mimeType.includes('mp4');
    const extension = isMp4 ? 'mp4' : 'webm';

    const date = new Date();
    const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeTitle = (trackTitle || 'plasma-video').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${safeTitle}-${dateStr}.${extension}`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}

export function toggleFullscreen(): Promise<void> {
  if (!document.fullscreenElement) {
    return document.documentElement.requestFullscreen().catch((err) => {
      console.warn('Fullscreen request failed:', err);
    });
  } else {
    return document.exitFullscreen().catch((err) => {
      console.warn('Exit fullscreen failed:', err);
    });
  }
}
