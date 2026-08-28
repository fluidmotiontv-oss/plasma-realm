import React, { useState, useRef } from 'react';
import { Track, RadioStation } from '../types';
import { RADIO_STATIONS, stationToTrack } from '../data/radioStations';
import { audioEngine } from '../audio/AudioEngine';
import {
  X,
  Upload,
  Music,
  Play,
  Pause,
  Trash2,
  Search,
  Radio,
  Sliders,
  Star,
  Globe,
  Plus,
  Signal,
  Disc,
  Volume2,
  FolderOpen,
  Network,
  Heart,
  ExternalLink,
} from 'lucide-react';

interface PlaylistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (track: Track) => void;
  onAddTracks: (newTracks: Track[]) => void;
  onRemoveTrack: (trackId: string) => void;
  onOpenSovereign?: () => void;
  onOpenDonate?: () => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onAddTracks,
  onRemoveTrack,
  onOpenSovereign,
  onOpenDonate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'radio' | 'uploads' | 'all'>('radio');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [radioStations, setRadioStations] = useState<RadioStation[]>(RADIO_STATIONS);

  // Custom Radio Stream Form State
  const [showAddCustomRadio, setShowAddCustomRadio] = useState(false);
  const [customStationName, setCustomStationName] = useState('');
  const [customStreamUrl, setCustomStreamUrl] = useState('');
  const [customFrequency, setCustomFrequency] = useState('');
  const [customGenre, setCustomGenre] = useState('Cyberpunk');

  // Interactive Analog Frequency Tuner Dial State (88.0 to 108.0 MHz)
  const [tunerFrequency, setTunerFrequency] = useState<number>(
    currentTrack?.frequencyVal || 98.5
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | File[]) => {
    const newTracks: Track[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|ogg|m4a|aac)$/i)) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
        const id = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        newTracks.push({
          id,
          title: cleanTitle,
          artist: 'Local Audio Master',
          album: 'High-Res Audio',
          genre: 'Local Audio',
          duration: 240,
          type: 'file',
          file: file,
          coverArt: 'from-cyan-600 via-indigo-600 to-purple-800',
        });
      }
    });

    if (newTracks.length > 0) {
      onAddTracks(newTracks);
      onSelectTrack(newTracks[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleAddCustomStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreamUrl || !customStationName) return;

    const freqNumber = parseFloat(customFrequency) || 104.5;
    const newStation: RadioStation = {
      id: `custom-radio-${Date.now()}`,
      name: customStationName,
      frequency: `${freqNumber.toFixed(1)} FM`,
      frequencyVal: freqNumber,
      tagline: 'Custom Live Audio Stream',
      genre: customGenre || 'Internet Radio',
      streamUrl: customStreamUrl,
      bitrate: '192 kbps Direct',
      location: 'Custom Stream',
      accentColor: '#06b6d4',
      coverArt: 'from-cyan-600 via-teal-700 to-slate-900',
      isFavorite: true,
    };

    setRadioStations((prev) => [newStation, ...prev]);
    const track = stationToTrack(newStation);
    onSelectTrack(track);
    setShowAddCustomRadio(false);
    setCustomStationName('');
    setCustomStreamUrl('');
    setCustomFrequency('');
  };

  const handleToggleFavorite = (stationId: string) => {
    setRadioStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, isFavorite: !s.isFavorite } : s))
    );
  };

  const handleTunerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setTunerFrequency(val);

    const closest = radioStations.find((s) => Math.abs(s.frequencyVal - val) < 0.7);

    if (closest) {
      const track = stationToTrack(closest);
      if (currentTrack?.id !== track.id) {
        onSelectTrack(track);
      }
    }
  };

  const filteredRadioStations = radioStations.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.frequency.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedGenre !== 'all' && !s.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
      return false;
    }
    return true;
  });

  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'uploads') return t.type === 'file';
    return true;
  });

  const formatDuration = (secs: number) => {
    if (!secs) return 'LIVE';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const radioGenres = [
    'all',
    'Cyberpunk',
    'Synthwave',
    'Ambient',
    'Lo-Fi',
    'Electronic',
    'IDM',
    'Vaporwave',
  ];

  return (
    <div
      id="playlist-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-[#0a0a14]/95 backdrop-blur-2xl border-l border-white/15 p-5 shadow-2xl flex flex-col justify-between text-white animate-in slide-in-from-right duration-300 overflow-hidden"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-wide flex items-center gap-2">
                Live Radio & Audio Player Library
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <p className="text-xs text-white/50">
                {filterTab === 'radio'
                  ? `${radioStations.length} Live Worldwide Stations (Lossless Audio)`
                  : `${tracks.length} Tracks in Audio Library`}
              </p>
            </div>
          </div>
          <button
            id="close-playlist-drawer"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 p-1 rounded-xl bg-white/5 border border-white/10 text-xs">
          <button
            onClick={() => setFilterTab('radio')}
            className={`py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              filterTab === 'radio'
                ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Live Radio Stations</span>
          </button>
          <button
            onClick={() => setFilterTab('uploads')}
            className={`py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              filterTab === 'uploads'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Disc className="h-3.5 w-3.5" />
            <span>My Audio Files</span>
          </button>
          <button
            onClick={() => setFilterTab('all')}
            className={`py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            <span>All Media</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
          <input
            id="search-tracks-input"
            type="text"
            placeholder={
              filterTab === 'radio'
                ? 'Search stations, frequencies, genres (SomaFM, DEF CON, Plaza)...'
                : 'Search audio title, artist, or genre...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Genre Chips (When Radio is selected) */}
        {filterTab === 'radio' && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
            {radioGenres.map((g) => {
              const active = selectedGenre === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap border transition-all ${
                    active
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {g === 'all' ? 'All Broadcasts' : g}
                </button>
              );
            })}
          </div>
        )}

        {/* Analog FM Tuner Dial Strip */}
        {filterTab === 'radio' && (
          <div className="mt-2 p-3 rounded-xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/30 to-black/60 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                <Signal className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                ANALOG FM DIAL
              </span>
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-500/30">
                {tunerFrequency.toFixed(1)} MHz
              </span>
            </div>

            {/* Slider Scale */}
            <div className="relative py-1">
              <input
                type="range"
                min="88.0"
                max="108.0"
                step="0.1"
                value={tunerFrequency}
                onChange={handleTunerChange}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] font-mono text-white/40 mt-1 px-1">
                <span>88.0</span>
                <span>94.0</span>
                <span>100.0</span>
                <span>104.0</span>
                <span>108.0 MHz</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Track / Station List */}
      <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2">
        {filterTab === 'radio' ? (
          // Radio Stations List
          filteredRadioStations.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-xs">
              No radio stations matching "{searchQuery}"
            </div>
          ) : (
            filteredRadioStations.map((station) => {
              const isCurrent =
                currentTrack?.radioStationId === station.id ||
                currentTrack?.title === station.name;
              return (
                <div
                  key={station.id}
                  onClick={() => onSelectTrack(stationToTrack(station))}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-cyan-500/80 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl bg-gradient-to-br ${station.coverArt} flex items-center justify-center text-white shrink-0 shadow`}
                    >
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-4">
                          <span className="w-0.5 h-full bg-white animate-pulse" />
                          <span className="w-0.5 h-3/4 bg-white animate-pulse" />
                          <span className="w-0.5 h-1/2 bg-white animate-pulse" />
                        </div>
                      ) : (
                        <Radio className="h-4 w-4 text-white/80 group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {station.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {station.frequency}
                        </span>
                      </div>
                      <div className="text-[11px] text-white/50 truncate">{station.tagline}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(station.id);
                      }}
                      className="p-1 rounded text-white/40 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`h-4 w-4 ${
                          station.isFavorite ? 'text-amber-400 fill-amber-400' : ''
                        }`}
                      />
                    </button>
                    <span className="text-[10px] font-mono text-white/40 hidden sm:inline">
                      {station.bitrate}
                    </span>
                  </div>
                </div>
              );
            })
          )
        ) : (
          // Uploads / All Media List
          <div className="space-y-2">
            {filteredTracks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-950/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl bg-gradient-to-br ${
                        track.coverArt || 'from-indigo-600 to-purple-800'
                      } flex items-center justify-center text-white shrink-0 shadow`}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{track.title}</div>
                      <div className="text-[11px] text-white/50 truncate">{track.artist}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-white/40">
                      {formatDuration(track.duration)}
                    </span>
                    {track.type === 'file' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(track.id);
                        }}
                        className="p-1 rounded text-white/40 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Area: Drag & Drop Uploader / Custom Radio Button */}
      <div className="pt-3 border-t border-white/10 space-y-2">
        {/* Custom Station Form Modal */}
        {showAddCustomRadio ? (
          <form
            onSubmit={handleAddCustomStation}
            className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 backdrop-blur-md space-y-2.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">Add Custom Live Web Stream</span>
              <button
                type="button"
                onClick={() => setShowAddCustomRadio(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Station Name (e.g. Neon Cyber Radio)"
              value={customStationName}
              onChange={(e) => setCustomStationName(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none"
              required
            />
            <input
              type="url"
              placeholder="Stream URL (http://... or https://...)"
              value={customStreamUrl}
              onChange={(e) => setCustomStreamUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none"
              required
            />
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="FM Frequency (e.g. 104.5)"
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                className="w-1/2 px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-white placeholder-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="w-1/2 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow transition"
              >
                Add & Tune
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* Custom Web Radio Stream Trigger */}
            <button
              onClick={() => setShowAddCustomRadio(true)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 text-xs font-semibold transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Stream</span>
            </button>

            {/* Local File Picker Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
            >
              <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
              <span>Import Audio Files</span>
            </button>
          </div>
        )}

        {/* Drag & Drop Audio Upload Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-3 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            isDragging
              ? 'border-indigo-400 bg-indigo-500/20'
              : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05]'
          }`}
        >
          <Upload className="h-4 w-4 text-white/50" />
          <span className="text-xs text-white/60">
            Drop MP3, WAV, FLAC, OGG files here for playback
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Sovereign.ISP & Donation Supporter Quick Banner */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
          {onOpenSovereign && (
            <button
              id="drawer-join-sovereign-btn"
              onClick={onOpenSovereign}
              className="flex-1 py-2 px-3 rounded-xl border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/50 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Network className="h-3.5 w-3.5 text-cyan-400" />
              <span>Join Sovereign.ISP</span>
              <ExternalLink className="h-3 w-3 text-cyan-400/60" />
            </button>
          )}

          {onOpenDonate && (
            <button
              id="drawer-donate-btn"
              onClick={onOpenDonate}
              className="flex-1 py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Heart className="h-3.5 w-3.5 text-rose-400 fill-rose-500/30" />
              <span>Donate & Support</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
