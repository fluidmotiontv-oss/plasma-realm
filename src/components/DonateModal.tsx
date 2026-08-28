import React, { useState } from 'react';
import {
  X,
  Heart,
  Coffee,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  CreditCard,
  QrCode,
  Gift,
} from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDonatedToast?: (msg: string) => void;
}

interface CryptoAddress {
  coin: string;
  symbol: string;
  network: string;
  address: string;
  iconColor: string;
}

const CRYPTO_ADDRESSES: CryptoAddress[] = [
  {
    coin: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Native SegWit',
    address: 'bc1q9enigma8p4x7k7296m0v7qzg8vsmf5v2u3a9sov',
    iconColor: 'text-amber-400',
  },
  {
    coin: 'Ethereum & EVM',
    symbol: 'ETH / USDC',
    network: 'Ethereum Mainnet / Arbitrum',
    address: '0x9E7D8A6136B3C84b2b3F3f7D76e5d8FaE832049c',
    iconColor: 'text-indigo-400',
  },
  {
    coin: 'Solana',
    symbol: 'SOL',
    network: 'Solana Network',
    address: '9EnigmaSoV8kMpQwG7xYvN4uR2zLtP3eJ6bA8cDx7Q',
    iconColor: 'text-cyan-400',
  },
  {
    coin: 'Monero',
    symbol: 'XMR',
    network: 'Privacy Relay',
    address: '888tNkZrPN6JsE39enigmaP4x7k7296m0v7qzg8vsmf5v2u3a9EnigmaSecretPrivacyNode77x',
    iconColor: 'text-orange-400',
  },
];

const DONATION_TIERS = [
  {
    id: 'tier-5',
    amount: '$5',
    name: 'Cyber Coffee',
    desc: 'Powers streaming server bandwidth & station relay nodes',
    badge: 'SUPPORTER',
  },
  {
    id: 'tier-15',
    amount: '$15',
    name: 'Audiophile Backer',
    desc: 'Funds 60FPS WebGL shaders & audio limiter development',
    badge: 'POPULAR',
  },
  {
    id: 'tier-35',
    amount: '$35',
    name: 'Sovereign Node Sponsor',
    desc: 'Sponsors continuous live radio relays & lossless audio feeds',
    badge: 'NODE SPONSOR',
  },
  {
    id: 'tier-100',
    amount: '$100',
    name: 'Visionary Patron',
    desc: 'VIP Sponsor watermark in video generator & eternal gratitude',
    badge: 'CHAMPION',
  },
];

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose, onDonatedToast }) => {
  const [selectedTier, setSelectedTier] = useState<string>('tier-15');
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState('20');
  const [showThankYou, setShowThankYou] = useState(false);

  if (!isOpen) return null;

  const handleCopyCrypto = (crypto: CryptoAddress) => {
    navigator.clipboard.writeText(crypto.address);
    setCopiedSymbol(crypto.symbol);
    setTimeout(() => setCopiedSymbol(null), 2400);
    if (onDonatedToast) {
      onDonatedToast(`Copied ${crypto.symbol} address to clipboard!`);
    }
  };

  const handleSimulateDonation = (amount: string, tierName: string) => {
    setShowThankYou(true);
    if (onDonatedToast) {
      onDonatedToast(`Thank you deeply for supporting with ${amount} (${tierName})! ❤️`);
    }
    setTimeout(() => setShowThankYou(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="donate-modal"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-rose-500/30 bg-[#0c0810]/95 p-5 sm:p-6 text-white shadow-[0_0_50px_rgba(244,63,94,0.15)] backdrop-blur-2xl custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
              <Heart className="h-6 w-6 fill-rose-500/40 text-rose-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">Support & Donate</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  OPEN SOURCE & AD-FREE
                </span>
              </div>
              <p className="text-xs text-rose-200/70">
                Help keep the 60FPS visualizer, DSP audio limiter, and Sovereign radio streams running
              </p>
            </div>
          </div>
          <button
            id="close-donate-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thank you animation banner if triggered */}
        {showThankYou && (
          <div className="my-3 p-3 rounded-xl border border-rose-400 bg-gradient-to-r from-rose-950 to-purple-950 text-center animate-in zoom-in duration-200">
            <div className="flex items-center justify-center gap-2 text-rose-300 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Thank You For Supporting Autonomous Sovereign Audio!</span>
              <Heart className="h-4 w-4 fill-current text-rose-400" />
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Your contribution keeps this visualizer free, high-performance, and open for everyone.
            </p>
          </div>
        )}

        {/* Patron & Fiat Links */}
        <div className="my-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-rose-400" />
            <span>Direct Creator Support Portals</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              id="donate-buymeacoffee-link"
              href="https://buymeacoffee.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 hover:bg-amber-900/40 text-amber-200 flex flex-col items-center justify-center gap-1 transition active:scale-95 group shadow"
            >
              <Coffee className="h-4 w-4 text-amber-400 group-hover:scale-110 transition" />
              <span className="text-xs font-bold">Buy Coffee</span>
              <ExternalLink className="h-3 w-3 text-amber-400/60" />
            </a>

            <a
              id="donate-kofi-link"
              href="https://ko-fi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/40 text-rose-200 flex flex-col items-center justify-center gap-1 transition active:scale-95 group shadow"
            >
              <Heart className="h-4 w-4 text-rose-400 group-hover:scale-110 transition" />
              <span className="text-xs font-bold">Ko-fi Tip</span>
              <ExternalLink className="h-3 w-3 text-rose-400/60" />
            </a>

            <a
              id="donate-paypal-link"
              href="https://paypal.me"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-950/20 hover:bg-blue-900/40 text-blue-200 flex flex-col items-center justify-center gap-1 transition active:scale-95 group shadow"
            >
              <CreditCard className="h-4 w-4 text-blue-400 group-hover:scale-110 transition" />
              <span className="text-xs font-bold">PayPal</span>
              <ExternalLink className="h-3 w-3 text-blue-400/60" />
            </a>

            <a
              id="donate-github-link"
              href="https://github.com/sponsors"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 hover:bg-purple-900/40 text-purple-200 flex flex-col items-center justify-center gap-1 transition active:scale-95 group shadow"
            >
              <Gift className="h-4 w-4 text-purple-400 group-hover:scale-110 transition" />
              <span className="text-xs font-bold">GitHub Sponsor</span>
              <ExternalLink className="h-3 w-3 text-purple-400/60" />
            </a>
          </div>
        </div>

        {/* Donation Tiers */}
        <div className="space-y-2 mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-2 flex items-center justify-between">
            <span>Sponsorship Tiers</span>
            <span className="text-rose-400 font-mono text-[11px]">Direct Project Funding</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DONATION_TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => {
                    setSelectedTier(tier.id);
                    handleSimulateDonation(tier.amount, tier.name);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-rose-500 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <span className="text-rose-400 text-sm">{tier.amount}</span>
                      <span>—</span>
                      <span>{tier.name}</span>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {tier.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">{tier.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cryptocurrency Direct Wallets with Instant Copy */}
        <div className="p-4 rounded-xl border border-white/10 bg-black/50 space-y-2.5">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span>Decentralized Crypto Wallets</span>
            </div>
            <span className="text-[10px] text-white/40 font-mono">1-Click Copy</span>
          </div>

          <div className="space-y-2">
            {CRYPTO_ADDRESSES.map((crypto) => {
              const isCopied = copiedSymbol === crypto.symbol;
              return (
                <div
                  key={crypto.symbol}
                  className="p-2.5 rounded-lg border border-white/10 bg-white/5 flex items-center justify-between gap-2 hover:border-white/20 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${crypto.iconColor}`}>{crypto.coin}</span>
                      <span className="text-[10px] font-mono text-white/40">({crypto.network})</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/70 truncate mt-0.5 select-all">
                      {crypto.address}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCopyCrypto(crypto)}
                    title={`Copy ${crypto.symbol} Address`}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition active:scale-95 shrink-0 ${
                      isCopied
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                        : 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <span>Thank you for keeping independent audio alive</span>
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
