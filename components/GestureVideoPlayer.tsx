'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

interface GestureVideoPlayerProps {
  src: string;
  onNextVideo?: () => void;
  onOpenComments?: () => void;
  poster?: string;
  videoTitle?: string;
}

export default function GestureVideoPlayer({ 
  src, 
  onNextVideo, 
  onOpenComments,
  poster,
  videoTitle 
}: GestureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [gestureMessage, setGestureMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  

  const tapCountRef = useRef(0);
  const tapPositionRef = useRef<'left' | 'center' | 'right' | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

 
  const fallbackVideos = [
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  ];

 
  useEffect(() => {
    setIsLoading(true);
    setVideoError(false);
    setRetryCount(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [src]);


  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      setVideoError(false);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setVideoError(false);
  };

  const handleVideoError = () => {
    console.warn('Video load error, trying fallback...');
    if (retryCount < fallbackVideos.length && videoRef.current) {
      const fallbackSrc = fallbackVideos[retryCount];
      console.log(`Trying fallback ${retryCount + 1}: ${fallbackSrc}`);
      videoRef.current.src = fallbackSrc;
      videoRef.current.load();
      setRetryCount(retryCount + 1);
    } else {
      setVideoError(true);
      setIsLoading(false);
    }
  };

  const showGestureFeedback = (message: string) => {
    setGestureMessage(message);
    setTimeout(() => setGestureMessage(''), 1000);
  };

 
  const handleGesture = useCallback((clientX: number, containerRect: DOMRect) => {
    const x = clientX - containerRect.left;
    const width = containerRect.width;
    
    let position: 'left' | 'center' | 'right';
    if (x < width / 3) {
      position = 'left';
    } else if (x > (width * 2) / 3) {
      position = 'right';
    } else {
      position = 'center';
    }
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    
    if (timeSinceLastTap > 500) {
      tapCountRef.current = 0;
    }
    
    lastTapTimeRef.current = now;
    tapCountRef.current++;
    tapPositionRef.current = position;
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }
    
    tapTimeoutRef.current = setTimeout(() => {
      const tapCount = tapCountRef.current;
      const tapPosition = tapPositionRef.current;
      
      console.log(`🎮 Gesture: ${tapCount} tap(s) on ${tapPosition}`);
      
      if (tapCount === 1 && tapPosition === 'center') {
        if (videoRef.current && !videoError) {
          if (videoRef.current.paused) {
            videoRef.current.play()
              .then(() => {
                setIsPlaying(true);
                showGestureFeedback('▶️ Play');
              })
              .catch(err => {
                console.error('Play failed:', err);
                showGestureFeedback('⚠️ Cannot play');
              });
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
            showGestureFeedback('⏸️ Pause');
          }
        }
      }
      else if (tapCount === 2) {
        if (tapPosition === 'right' && videoRef.current && duration) {
          const newTime = Math.min(videoRef.current.currentTime + 10, duration);
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
          showGestureFeedback(`⏩ +10 seconds`);
        } else if (tapPosition === 'left' && videoRef.current) {
          const newTime = Math.max(videoRef.current.currentTime - 10, 0);
          videoRef.current.currentTime = newTime;
          setCurrentTime(newTime);
          showGestureFeedback(`⏪ -10 seconds`);
        }
      }
      else if (tapCount === 3) {
        if (tapPosition === 'center') {
          if (onNextVideo) {
            showGestureFeedback(`⏭️ Next video`);
            onNextVideo();
          }
        } 
        else if (tapPosition === 'right') {
          showGestureFeedback(`👋 Closing...`);
          setTimeout(() => {
            if (window.confirm('Close website?')) {
              window.close();
            }
          }, 300);
        }
        else if (tapPosition === 'left') {
          if (onOpenComments) {
            showGestureFeedback(`💬 Comments`);
            onOpenComments();
          }
        }
      }
      
      tapCountRef.current = 0;
      tapPositionRef.current = null;
    }, 300);
  }, [duration, onNextVideo, onOpenComments, videoError]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    handleGesture(e.clientX, rect);
  }, [handleGesture]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const touch = e.changedTouches[0];
    const rect = containerRef.current.getBoundingClientRect();
    handleGesture(touch.clientX, rect);
  }, [handleGesture]);

  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current || videoError) return;
      if (document.activeElement?.tagName === 'INPUT') return;
      
      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (videoRef.current.paused) {
            videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            showGestureFeedback('▶️ Play');
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
            showGestureFeedback('⏸️ Pause');
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
          showGestureFeedback('⏩ +10 seconds');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
          showGestureFeedback('⏪ -10 seconds');
          break;
        case 'ArrowUp':
          e.preventDefault();
          videoRef.current.volume = Math.min(videoRef.current.volume + 0.1, 1);
          setVolume(videoRef.current.volume);
          break;
        case 'ArrowDown':
          e.preventDefault();
          videoRef.current.volume = Math.max(videoRef.current.volume - 0.1, 0);
          setVolume(videoRef.current.volume);
          break;
        case 'm':
          e.preventDefault();
          videoRef.current.muted = !videoRef.current.muted;
          setIsMuted(videoRef.current.muted);
          break;
        case 'f':
          e.preventDefault();
          containerRef.current?.requestFullscreen();
          break;
        case 'n':
          if (onNextVideo) {
            showGestureFeedback('⏭️ Next');
            onNextVideo();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [duration, onNextVideo, videoError]);

  const handleMouseMove = () => setShowControls(true);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && duration) {
      const seekTime = (parseFloat(e.target.value) / 100) * duration;
      videoRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  
  const getVideoSrc = () => {
    if (videoError && retryCount >= fallbackVideos.length) {
      return fallbackVideos[0];
    }
    return src;
  };

  return (
    <div 
      ref={containerRef}
      className="relative group bg-black rounded-xl overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: 'pointer', touchAction: 'none' }}
    >
      { }
      <video
        ref={videoRef}
        key={getVideoSrc()}
        className="w-full h-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onError={handleVideoError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
        playsInline
      >
        <source src={getVideoSrc()} type="video/mp4" />
      </video>
      
      { }
      {isLoading && !videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}
      
      { }
      {videoError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <div className="text-white text-center">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-lg font-semibold">Video unavailable</p>
            <p className="text-sm text-gray-400 mt-2">Try next video</p>
            {onNextVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNextVideo();
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
              >
                Next Video ⏭️
              </button>
            )}
          </div>
        </div>
      )}
      
      { }
      {gestureMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-lg font-semibold z-50 pointer-events-none animate-fadeOut">
          {gestureMessage}
        </div>
      )}
      
      { }
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="mb-2">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer"
            style={{ background: `linear-gradient(to right, #3b82f6 ${progress}%, #4b5563 ${progress}%)` }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={(e) => {
              e.stopPropagation();
              if (videoRef.current && !videoError) {
                videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
              }
            }} className="text-white hover:text-blue-400 transition text-xl">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:text-blue-400 transition">
                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {onNextVideo && (
              <button onClick={(e) => { e.stopPropagation(); onNextVideo(); }} className="text-white hover:text-blue-400 transition text-xl">
                ⏭️
              </button>
            )}
            {onOpenComments && (
              <button onClick={(e) => { e.stopPropagation(); onOpenComments(); }} className="text-white hover:text-blue-400 transition text-xl">
                💬
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white hover:text-blue-400 transition text-xl">
              ⛶
            </button>
          </div>
        </div>
      </div>
      
      { }
      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
        <div className="font-semibold mb-1">🎮 Gesture Controls</div>
        <div className="space-y-1 text-[11px]">
          <div>• Single tap center → Play/Pause</div>
          <div>• Double tap left → -10 sec</div>
          <div>• Double tap right → +10 sec</div>
          <div>• Triple tap center → Next video</div>
          <div>• Triple tap left → Comments</div>
          <div>• Triple tap right → Close website</div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
        }
        .animate-fadeOut {
          animation: fadeOut 1s ease forwards;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}