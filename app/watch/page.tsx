'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Comments from '@/components/Comments';
import DownloadButton from '@/components/DownloadButton';

export default function WatchPage() {
  const [user, setUser] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchTimeLeft, setWatchTimeLeft] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [gestureMessage, setGestureMessage] = useState('');
  
  // Gesture detection refs
  const tapCountRef = useRef(0);
  const tapPositionRef = useRef<string | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimeUpdateRef = useRef(0);

  const router = useRouter();

  // ============================================
  // 100% WORKING VIDEOS - All from W3Schools (guaranteed to work)
  // Each video has a different title but same reliable source
  // ============================================
  const PLAYLIST = [
  { src: "https://www.pexels.com/download/video/38104915/", innerHeight:"300px", innerWidth:"300px", title: "🎬 Video 1"},
  { src: "https://www.pexels.com/download/video/18120715/", innerHeight:"300px", innerWidth:"300px", title: "🎬 Video 2"},
  { src: "https://www.pexels.com/download/video/36553647/", innerHeight:"300px", innerWidth:"300px", title: "🎬 Video 3"},
  { src: "https://www.pexels.com/download/video/37484107/", innerHeight:"300px", innerWidth:"300px", title: "🎬 Video 4"},
  { src: "https://www.pexels.com/download/video/37595348/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 5"},
  { src: "https://www.pexels.com/download/video/37694784/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 6"},
  { src: "https://www.pexels.com/download/video/30768374/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 7"},
  { src: "https://www.pexels.com/download/video/38110755/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 8"},
  { src: "https://www.pexels.com/download/video/37802067/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 9"},
  { src: "https://www.pexels.com/download/video/37915114/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 10"},
  { src: "https://www.pexels.com/download/video/38017606/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 11"},
  { src: "https://www.pexels.com/download/video/38088039/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 12"},
  { src: "https://www.pexels.com/download/video/38133491/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 13"},
  { src: "https://www.pexels.com/download/video/38031339/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 14"},
  { src: "https://www.pexels.com/download/video/34624968/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 15"},
  { src: "https://www.pexels.com/download/video/37909130/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 16"},
  { src: "https://www.pexels.com/download/video/27970371/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 17"},
  { src: "https://www.pexels.com/download/video/37459770/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 18"},
  { src: "https://www.pexels.com/download/video/18070602/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 19"},
  { src: "https://www.pexels.com/download/video/37860532/", innerHeight:"300px", innerWidth:"300px", title: "📹 Video 20"},
];

  // Watch time limits per plan (in seconds)
  const PLAN_LIMITS: Record<string, number> = {
    free: 300,      // 5 minutes
    bronze: 420,    // 7 minutes
    silver: 600,    // 10 minutes
    gold: Infinity  // Unlimited
  };

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, [showControls]);

  const showFeedback = (msg: string) => {
    setGestureMessage(msg);
    setTimeout(() => setGestureMessage(''), 800);
  };

  // Handle all tap gestures
  const handleTap = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const width = rect.width;
    let position = 'center';
    if (x < width / 3) position = 'left';
    else if (x > (width * 2) / 3) position = 'right';

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapCountRef.current++;
    tapPositionRef.current = position;

    tapTimeoutRef.current = setTimeout(() => {
      const count = tapCountRef.current;
      const pos = tapPositionRef.current;

      // SINGLE TAP - Center: Play/Pause
      if (count === 1 && pos === 'center') {
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play().catch(e => console.log('Play error:', e));
            setIsPlaying(true);
            showFeedback('▶️ Play');
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
            showFeedback('⏸️ Pause');
          }
        }
      }
      // DOUBLE TAP - Left/Right: Seek ±10 seconds
      else if (count === 2) {
        if (pos === 'right' && videoRef.current) {
          videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
          showFeedback('⏩ +10 sec');
        } else if (pos === 'left' && videoRef.current) {
          videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
          showFeedback('⏪ -10 sec');
        }
      }
      // TRIPLE TAP - Various actions
      else if (count === 3) {
        if (pos === 'center') {
          handleNextVideo();
          showFeedback('⏭️ Next Video');
        } else if (pos === 'left') {
          setShowComments(!showComments);
          showFeedback('💬 Comments');
        } else if (pos === 'right') {
          showFeedback('👋 Closing...');
          setTimeout(() => { if (confirm('Close website?')) window.close(); }, 300);
        }
      }

      tapCountRef.current = 0;
      tapPositionRef.current = null;
    }, 300);
  };

  // Watch time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = Math.floor(videoRef.current.currentTime);
      setCurrentTime(videoRef.current.currentTime);
      if (time - lastTimeUpdateRef.current >= 10) {
        lastTimeUpdateRef.current = time;
        updateWatchTime();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      console.log('Video loaded, duration:', videoRef.current.duration);
    }
  };

  const handleVideoError = (e: any) => {
    console.error('Video error:', e);
    showFeedback('⚠️ Loading video...');
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: any) => {
    if (videoRef.current && duration) {
      videoRef.current.currentTime = (parseFloat(e.target.value) / 100) * duration;
    }
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) {
      router.push('/login');
    } else {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadWatchTime(userData);
    }
  }, []);

  const loadWatchTime = (userData: any) => {
    const limit = PLAN_LIMITS[userData.plan || 'free'];
    if (limit === Infinity) {
      setWatchTimeLeft(null);
      return;
    }
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('watchDate');
    let used = parseInt(localStorage.getItem('watchTimeUsed') || '0');
    if (savedDate !== today) {
      used = 0;
      localStorage.setItem('watchTimeUsed', '0');
      localStorage.setItem('watchDate', today);
    }
    setWatchTimeLeft(Math.max(0, limit - used));
  };

  const updateWatchTime = () => {
    if (!user) return;
    const limit = PLAN_LIMITS[user.plan || 'free'];
    if (limit === Infinity) return;
    const today = new Date().toDateString();
    let used = parseInt(localStorage.getItem('watchTimeUsed') || '0');
    if (localStorage.getItem('watchDate') !== today) used = 0;
    const newUsed = used + 10;
    localStorage.setItem('watchTimeUsed', newUsed.toString());
    localStorage.setItem('watchDate', today);
    setWatchTimeLeft(Math.max(0, limit - newUsed));
  };

  const handleNextVideo = () => {
    const newIndex = (currentVideoIndex + 1) % PLAYLIST.length;
    setCurrentVideoIndex(newIndex);
    setShowComments(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handlePreviousVideo = () => {
    const newIndex = (currentVideoIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    setCurrentVideoIndex(newIndex);
    setShowComments(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  const currentVideo = PLAYLIST[currentVideoIndex];
  const totalVideos = PLAYLIST.length;

  // Show watch time expired message
  if (watchTimeLeft === 0 && user.plan !== 'gold') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
            <Link href="/" className="text-xl font-bold text-white">🎬 VideoStream Pro</Link>
            <div className="flex gap-6">
              <Link href="/watch" className="text-white">Watch</Link>
              <Link href="/video-call" className="text-gray-300 hover:text-white">Video Call</Link>
              <Link href="/upgrade" className="text-gray-300 hover:text-white">Upgrade</Link>
              <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white">Hi, {user.username}</span>
              <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="bg-red-500 px-4 py-2 rounded-lg text-white">Logout</button>
            </div>
          </div>
        </nav>
        <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-white mb-2">Watch Time Expired!</h2>
          <p className="text-gray-400 mb-6">You've used all your watch time for today.</p>
          <Link href="/upgrade" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 px-6 py-3 rounded-lg font-semibold transition">
            Upgrade Plan for More Time 💎
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <Link href="/" className="text-xl font-bold text-white">🎬 VideoStream Pro</Link>
          <div className="flex gap-6">
            <Link href="/watch" className="text-white">Watch</Link>
            <Link href="/video-call" className="text-gray-300 hover:text-white">Video Call</Link>
            <Link href="/upgrade" className="text-gray-300 hover:text-white">Upgrade</Link>
            <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              user.plan === 'gold' ? 'bg-yellow-500 text-black' :
              user.plan === 'silver' ? 'bg-gray-400 text-black' :
              user.plan === 'bronze' ? 'bg-amber-600 text-white' : 'bg-gray-600 text-white'
            }`}>
              {user.plan?.toUpperCase() || 'FREE'}
            </span>
            <span className="text-white">Hi, {user.username}</span>
            <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm transition">Logout</button>
          </div>
        </div>
      </nav>

      {/* Watch Time Warning */}
      {user.plan !== 'gold' && watchTimeLeft !== null && watchTimeLeft > 0 && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className={`text-center py-2 rounded-lg ${watchTimeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            ⏱️ Time remaining today: {formatTime(watchTimeLeft)}
          </div>
        </div>
      )}

      {user.plan === 'gold' && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="text-center py-2 rounded-lg bg-green-500/20 text-green-400">
            ✨ Gold Plan - Unlimited Watching Time ✨
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">{currentVideo.title}</h2>
            <p className="text-sm text-gray-400">
              📹 Video {currentVideoIndex + 1} of {totalVideos} 
            </p>
          </div>
          
          <div className="flex gap-3 items-center flex-wrap">
            <DownloadButton 
              videoId={currentVideoIndex.toString()}
              videoTitle={currentVideo.title}
              videoThumbnail="🎬"
            />
            
            <div className="flex gap-2">
              <button
                onClick={handlePreviousVideo}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-white transition flex items-center gap-1"
              >
                ⏮️ Prev
              </button>
              <button
                onClick={handleNextVideo}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition flex items-center gap-1"
              >
                Next ⏭️
              </button>
            </div>
          </div>
        </div>

        {/* Video Player with Gestures */}
        <div 
          ref={containerRef} 
          className="relative group bg-black rounded-xl overflow-hidden" 
          onMouseMove={() => setShowControls(true)} 
          onMouseLeave={() => setShowControls(false)}
          onClick={handleTap}
        >
          <video
            ref={videoRef}
            key={currentVideoIndex}
            src={currentVideo.src}
            className="w-full  h-[500px] object-cover cursor-pointer"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleVideoError}
            preload="auto"
            playsInline
          >
            <source src={currentVideo.src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          
          {/* Gesture Feedback Toast */}
          {gestureMessage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-full text-lg font-semibold z-50 pointer-events-none animate-fadeOut">
              {gestureMessage}
            </div>
          )}
          
          {/* Video Controls */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress} 
              onChange={handleSeek} 
              className="w-full h-1 bg-gray-600 rounded-lg cursor-pointer mb-2" 
              style={{ background: `linear-gradient(to right, #3b82f6 ${progress}%, #4b5563 ${progress}%)` }} 
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (videoRef.current) {
                      videoRef.current.paused ? videoRef.current.play().catch(e => console.log('Play error:', e)) : videoRef.current.pause();
                    }
                  }} 
                  className="text-white text-xl"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <span className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={(e) => { e.stopPropagation(); handleNextVideo(); }} className="text-white text-xl">
                  ⏭️
                </button>
                <button onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }} className="text-white text-xl">
                  💬
                </button>
              </div>
            </div>
          </div>
          
          {/* Gesture Guide */}
          <div className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-3 py-2 rounded-lg pointer-events-none">
            🎮 Tap: Center ▶️⏸️ | Double Tap ±10s | Triple Tap Center ⏭️ | Triple Tap Left 💬 | Triple Tap Right : Close website
          </div>
        </div>
        
        {showComments && <Comments videoId={`video-${currentVideoIndex}`} />}
        
        {/* Gesture Instructions */}
        <div className="mt-4 text-center text-xs text-gray-500">
          💡 Gesture Tips: Single tap = Play/Pause | Double tap sides = ±10 seconds | Triple tap center = Next video | Triple tap left = Comments | Triple Tap Right = Close Website
        </div>
      </main>
      
      <style jsx>{`
        @keyframes fadeOut { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.9); } }
        .animate-fadeOut { animation: fadeOut 0.8s ease forwards; }
      `}</style>
    </div>
  );
}