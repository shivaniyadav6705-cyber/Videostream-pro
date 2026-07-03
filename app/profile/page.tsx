'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';

interface Download {
  id: number;
  videoId: string;
  videoTitle: string;
  videoDuration: string;
  videoThumbnail: string;
  downloadedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  plan: string;
  planStartDate?: string;
  planEndDate?: string;
  createdAt: string;
  downloadsToday?: number;
  downloadedVideos?: Download[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [stats, setStats] = useState({
    downloadsToday: 0,
    totalDownloads: 0,
    plan: 'free',
  });
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Download | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  // Video URL mapping for playback
  const getVideoUrl = (videoTitle: string): string => {
    // Map video titles to actual video URLs
    const videoMap: Record<string, string> = {
      '🐰 Big Buck Bunny': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      '🐘 Elephants Dream': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      '🗡️ Sintel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      '🤖 Tears of Steel': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      '🔥 For Bigger Blazes': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      '🏃 For Bigger Escapes': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      '🎢 For Bigger Funrides': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFunrides.mp4',
      '🚗 For Bigger Joyrides': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      '😤 For Bigger Meltdowns': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      '🚙 Subaru Outback': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
      '🚘 What Car?': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCar.mp4',
      '🌿 Images of Nature': 'https://storage.googleapis.com/gtv-videos-bucket/sample/ImagesOfNature.mp4',
      '🏙️ Driving in City': 'https://storage.googleapis.com/gtv-videos-bucket/sample/DrivingInCity.mp4',
      '👥 People Waiting': 'https://storage.googleapis.com/gtv-videos-bucket/sample/PeopleWaiting.mp4',
    };

    // Try to find exact match or partial match
    for (const [key, value] of Object.entries(videoMap)) {
      if (videoTitle.includes(key) || key.includes(videoTitle)) {
        return value;
      }
    }
    
    // Default fallback video
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token || !savedUser) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchDownloads(token);
    } catch (e) {
      console.error('Error parsing user:', e);
      router.push('/login');
    }
    
    setLoading(false);
  }, []);

  const fetchDownloads = async (token: string) => {
    try {
      setRefreshing(true);
      console.log('📥 Fetching downloads...');
      
      const res = await fetch('/api/download', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const data = await res.json();
      console.log('📥 Downloads API response:', data);
      
      if (data.success) {
        const downloadsList = data.downloads || [];
        setDownloads(downloadsList);
        setStats({
          downloadsToday: data.downloadsToday || 0,
          totalDownloads: downloadsList.length,
          plan: data.plan || 'free',
        });
        
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          userData.downloadedVideos = downloadsList;
          userData.downloadsToday = data.downloadsToday || 0;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        console.log(`✅ Loaded ${downloadsList.length} downloads`);
      } else {
        console.error('❌ API error:', data.error);
        toast.error(data.error || 'Failed to load downloads');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      toast.error('Error loading downloads');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchDownloads(token);
      toast.success('Refreshed!');
    }
  };

  const handlePlayVideo = (download: Download) => {
    setSelectedVideo(download);
    setIsModalOpen(true);
    // Play video when modal opens
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked, user can click play manually
        });
      }
    }, 500);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setSelectedVideo(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="text-white text-center py-20">Loading...</div>;
  if (!user) return null;

  const getPlanBadge = () => {
    const plans: Record<string, { label: string; color: string; bg: string }> = {
      gold: { label: '💎 Gold', color: 'text-black', bg: 'bg-yellow-500' },
      silver: { label: '🥈 Silver', color: 'text-black', bg: 'bg-gray-400' },
      bronze: { label: '🥉 Bronze', color: 'text-white', bg: 'bg-amber-600' },
      free: { label: '🆓 Free', color: 'text-white', bg: 'bg-gray-600' }
    };
    return plans[user.plan] || plans.free;
  };

  const planBadge = getPlanBadge();

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          {/* Profile Header */}
          <div className="flex items-center gap-6 flex-wrap mb-6">
            <div className="text-6xl">👤</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <p className="text-gray-400">{user.email}</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${planBadge.bg} ${planBadge.color}`}>
                  {planBadge.label}
                </span>
                <span className="text-xs text-gray-400">📅 Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalDownloads}</p>
              <p className="text-xs text-gray-400">Total Downloads</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.downloadsToday}</p>
              <p className="text-xs text-gray-400">Today's Downloads</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white uppercase">{stats.plan}</p>
              <p className="text-xs text-gray-400">Current Plan</p>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white transition disabled:opacity-50"
            >
              {refreshing ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {/* Downloads Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">📥 My Downloads</h2>
              <span className="text-xs text-gray-400">{downloads.length} items</span>
            </div>
            
            {downloads.length === 0 ? (
              <div className="bg-slate-700/30 rounded-lg p-8 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-gray-400 text-sm">No downloads yet.</p>
                <p className="text-gray-500 text-xs mt-1">Download videos to see them here!</p>
                <Link href="/watch" className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm">
                  Browse Videos →
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {downloads.map((download) => (
                  <div key={download.id} className="bg-slate-700/30 rounded-lg p-3 flex justify-between items-center hover:bg-slate-700/50 transition">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{download.videoThumbnail || '🎬'}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate">{download.videoTitle}</p>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>⏱️ {download.videoDuration}</span>
                          <span>📅 {formatDate(download.downloadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handlePlayVideo(download)}
                      className="text-xs bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white transition flex-shrink-0"
                    >
                      ▶️ Play
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ✅ Video Player Modal - Plays the actual video */}
      {isModalOpen && selectedVideo && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div 
            className="relative max-w-4xl w-full bg-black rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
            >
              ✕
            </button>

            {/* Video Info */}
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600">
              <h3 className="text-white font-semibold text-lg">{selectedVideo.videoTitle}</h3>
              <p className="text-white/70 text-sm">⏱️ Duration: {selectedVideo.videoDuration}</p>
            </div>

            {/* Video Player */}
            <video
              ref={videoRef}
              controls
              autoPlay
              className="w-full h-auto max-h-[70vh]"
              controlsList="nodownload"
            >
              <source src={getVideoUrl(selectedVideo.videoTitle)} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Footer */}
            <div className="p-4 bg-slate-900 text-center text-gray-400 text-sm">
              💡 Downloaded on: {formatDate(selectedVideo.downloadedAt)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}