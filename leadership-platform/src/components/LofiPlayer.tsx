'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radio, Play, Pause, SkipForward, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'

interface Track {
  name: string
  artist: string
  src: string
}

// Using royalty-free lofi URLs (replace with actual hosted files)
const PLAYLISTS = {
  focus: {
    name: 'Focus Mode',
    emoji: '🎯',
    tracks: [
      { name: 'Study Session', artist: 'Lofi Beats', src: '/audio/lofi-1.mp3' },
      { name: 'Late Night', artist: 'Chill Hop', src: '/audio/lofi-2.mp3' },
      { name: 'Coffee Shop', artist: 'Ambient', src: '/audio/lofi-3.mp3' },
    ]
  },
  chill: {
    name: 'Chill Vibes',
    emoji: '🌙',
    tracks: [
      { name: 'Midnight Rain', artist: 'Lo-Fi Dreams', src: '/audio/chill-1.mp3' },
      { name: 'Sunset Drive', artist: 'Beats To Relax', src: '/audio/chill-2.mp3' },
    ]
  },
  energy: {
    name: 'Energy Boost',
    emoji: '⚡',
    tracks: [
      { name: 'Level Up', artist: 'Game Beats', src: '/audio/energy-1.mp3' },
      { name: 'Power Hour', artist: 'Study Mix', src: '/audio/energy-2.mp3' },
    ]
  }
}

export default function LofiPlayer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [currentPlaylist, setCurrentPlaylist] = useState<keyof typeof PLAYLISTS>('focus')
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement>(null)

  const playlist = PLAYLISTS[currentPlaylist]
  const currentTrack = playlist.tracks[currentTrackIndex]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => {
          // Handle autoplay restrictions
          console.log('Autoplay blocked')
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => 
      (prev + 1) % playlist.tracks.length
    )
  }

  const changePlaylist = (key: keyof typeof PLAYLISTS) => {
    setCurrentPlaylist(key)
    setCurrentTrackIndex(0)
    setIsPlaying(false)
  }

  return (
    <motion.div 
      className="fixed bottom-4 right-4 z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <audio 
        ref={audioRef}
        src={currentTrack?.src}
        loop
        onEnded={nextTrack}
      />
      
      {/* Collapsed view */}
      <motion.div 
        className={`bg-surface-800/90 backdrop-blur-lg rounded-2xl shadow-xl border border-surface-700 overflow-hidden ${
          isExpanded ? 'w-72' : 'w-auto'
        }`}
      >
        {/* Mini player */}
        <div 
          className="flex items-center gap-3 p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <motion.div
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="p-2 bg-primary-500/20 rounded-lg"
          >
            <Radio className="w-5 h-5 text-primary-400" />
          </motion.div>
          
          {!isExpanded && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {isPlaying ? currentTrack?.name : 'Lo-Fi Radio'}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay() }}
                className="p-2 bg-surface-700 hover:bg-surface-600 rounded-lg"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </>
          )}
          
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-surface-400 ml-auto" />
          ) : (
            <ChevronUp className="w-4 h-4 text-surface-400" />
          )}
        </div>
        
        {/* Expanded view */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-surface-700"
            >
              {/* Current track */}
              <div className="p-4">
                <div className="text-lg font-semibold text-white">{currentTrack?.name}</div>
                <div className="text-sm text-surface-400">{currentTrack?.artist}</div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-4 p-4 pt-0">
                <button
                  onClick={togglePlay}
                  className="p-3 bg-primary-600 hover:bg-primary-500 rounded-full"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={nextTrack}
                  className="p-2 bg-surface-700 hover:bg-surface-600 rounded-full"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-surface-700 hover:bg-surface-600 rounded-full"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Volume slider */}
              <div className="px-4 pb-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1 bg-surface-700 rounded-full appearance-none cursor-pointer"
                />
              </div>
              
              {/* Playlist selector */}
              <div className="p-4 pt-2 border-t border-surface-700">
                <div className="text-xs text-surface-400 mb-2">PLAYLISTS</div>
                <div className="flex gap-2">
                  {Object.entries(PLAYLISTS).map(([key, pl]) => (
                    <button
                      key={key}
                      onClick={() => changePlaylist(key as keyof typeof PLAYLISTS)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                        currentPlaylist === key 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-surface-700 hover:bg-surface-600 text-surface-300'
                      }`}
                    >
                      {pl.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
