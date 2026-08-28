import React, { useState } from 'react';
import {
  X,
  Globe,
  ExternalLink,
  ShieldCheck,
  Zap,
  Radio,
  Copy,
  Check,
  Network,
  Cpu,
  Lock,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface SovereignIspModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SovereignIspModal: React.FC<SovereignIspModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [gatewayUrl, setGatewayUrl] = useState('https://sovereign.isp');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(gatewayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="sovereign-isp-modal"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-[#080c14]/95 p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
              <Network className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">Join Sovereign.ISP</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  DECENTRALIZED ISP
                </span>
              </div>
              <p className="text-xs text-cyan-200/70">
                Self-sovereign community internet, autonomous mesh relays & unthrottled streaming
              </p>
            </div>
          </div>
          <button
            id="close-sovereign-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Network Status Pill */}
        <div className="my-4 p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </div>
            <div>
              <span className="text-xs font-semibold text-white">Sovereign Mesh Gateway Status: </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">ACTIVE & PEERING</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-cyan-300/80 bg-black/40 px-2.5 py-1 rounded-md border border-cyan-500/20">
            Node: SV-9942-PLASMA
          </div>
        </div>

        {/* Core Value Pillars */}
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold text-xs">
                <Wifi className="h-4 w-4 text-cyan-400" />
                <span>Community-Owned Mesh</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Connect directly through decentralized community ISP nodes with no corporate middleman or tollbooths.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                <span>Zero-Log Sovereignty</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Autonomous, encrypted peer routing that preserves listener privacy and resists network censorship.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                <Zap className="h-4 w-4 text-emerald-400" />
                <span>High-Fidelity Audio Relay</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Optimized low-latency pipes for lossless audio streaming, FLAC web radio, and 60FPS video broadcasting.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                <Cpu className="h-4 w-4 text-amber-400" />
                <span>Run a Node & Earn</span>
              </div>
              <p className="text-[11px] text-white/60 leading-relaxed">
                Contribute excess bandwidth as a Sovereign.ISP relay point to support independent radio worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Link & Actions */}
        <div className="p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/40 via-black to-indigo-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Official Gateway & Membership Portal
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
              HTTPS://SOVEREIGN.ISP
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            {/* Direct Join Link */}
            <a
              id="sovereign-external-join-link"
              href="https://sovereign.isp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.4)] transition active:scale-98"
            >
              <Globe className="h-4 w-4" />
              <span>Launch Sovereign.ISP Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {/* Copy Gateway Link Button */}
            <button
              id="copy-sovereign-link-btn"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition active:scale-95"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-cyan-400" />}
              <span>{copied ? 'Copied URL!' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Fallback & Alternative Relay Links */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/50">
            <span>Alternative Gateway:</span>
            <a
              href="https://thesovereignnetwork.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
            >
              thesovereignnetwork.org <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <span>Decentralized Infrastructure Protocol</span>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
