'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface Download {
  id: number;
  videoId: string;
  videoTitle: string;
  videoDuration: string;
  videoThumbnail: string;
  videoSrc?: string;
  downloadedAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [stats, setStats] = useState({
    downloadsToday: 0,
    totalDownloads: 0,
    plan: 'free',
  });
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Download | null>(null);
  const router = useRouter();

  // Video URLs for playback (matching watch page playlist)
  const videoSources: Record<string, string> = {
    '0': "https://www.w3schools.com/html/mov_bbb.mp4",
    '1': "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
    '2': "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
    '3': "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_2mb.mp4",
    '4': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    '5': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    'Big Buck Bunny': "https://www.w3schools.com/html/mov_bbb.mp4",
    'Sample Video 1': "https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4",
    'For Bigger Blazes': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    'For Bigger Escapes': "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) {
      router.push('/login');
    } else {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchDownloads();
    }
    setLoading(false);
  }, []);

  const fetchDownloads = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/download', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        // Add video source URLs to downloads
        const downloadsWithSrc = (data.downloads || []).map((download: Download) => ({
          ...download,
          videoSrc: getVideoSource(download.videoTitle, download.videoId),
        }));
        setDownloads(downloadsWithSrc);
        setStats({
          downloadsToday: data.downloadsToday || 0,
          totalDownloads: data.downloads?.length || 0,
          plan: data.plan || 'free',
        });
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  };

  const getVideoSource = (title: string, videoId: string): string => {
    // First try by videoId
    if (videoSources[videoId]) return videoSources[videoId];
    // Then try by title
    for (const [key, value] of Object.entries(videoSources)) {
      if (title.includes(key) || key.includes(title)) {
        return value;
      }
    }
    // Default video
    return "https://www.w3schools.com/html/mov_bbb.mp4";
  };

  const handlePlayVideo = (download: Download) => {
    setSelectedVideo(download);
  };

  const closeVideoPlayer = () => {
    setSelectedVideo(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getPlanLimit = () => {
    const limits: Record<string, string> = {
      free: '1 download/day',
      bronze: 'Unlimited downloads',
      silver: 'Unlimited downloads',
      gold: 'Unlimited downloads',
    };
    return limits[stats.plan] || '1 download/day';
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar user={user} onLogout={handleLogout} />

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={closeVideoPlayer}>
          <div className="relative max-w-5xl w-full bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeVideoPlayer}
              className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
            >
              ✕
            </button>
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600">
              <h3 className="text-white font-semibold text-lg">{selectedVideo.videoTitle}</h3>
              <p className="text-white/70 text-sm">⏱️ Duration: {selectedVideo.videoDuration}</p>
            </div>
            <video
              src={selectedVideo.videoSrc}
              controls
              autoPlay
              className="w-full h-auto"
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video>
            <div className="p-4 bg-slate-900 text-center text-gray-400 text-sm">
              💡 Tip: You can also find this video in the Watch page
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl p-8 mb-8 border border-theme">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-6xl">👤</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <p className="text-gray-400">{user.email}</p>
              <div className="flex gap-4 mt-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  user.plan === 'gold' ? 'bg-yellow-500 text-black' :
                  user.plan === 'silver' ? 'bg-gray-400 text-black' :
                  user.plan === 'bronze' ? 'bg-amber-600 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {user.plan?.toUpperCase() || 'FREE'} PLAN
                </span>
                <span className="text-sm text-gray-400">📅 Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card rounded-xl p-4 text-center border border-theme">
            <div className="text-3xl mb-1">📥</div>
            <div className="text-2xl font-bold text-white">{stats.totalDownloads}</div>
            <div className="text-sm text-gray-400">Total Downloads</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center border border-theme">
            <div className="text-3xl mb-1">📅</div>
            <div className="text-2xl font-bold text-white">{stats.downloadsToday}</div>
            <div className="text-sm text-gray-400">Downloads Today</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center border border-theme">
            <div className="text-3xl mb-1">💎</div>
            <div className="text-2xl font-bold text-white">{stats.plan.toUpperCase()}</div>
            <div className="text-sm text-gray-400">Current Plan</div>
          </div>
          <div className="bg-card rounded-xl p-4 text-center border border-theme">
            <div className="text-3xl mb-1">⚡</div>
            <div className="text-2xl font-bold text-white">{getPlanLimit()}</div>
            <div className="text-sm text-gray-400">Download Limit</div>
          </div>
        </div>

        {/* Downloads Section */}
        <div className="bg-card rounded-2xl p-6 border border-theme">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">📥 My Downloads</h2>
            {stats.plan === 'free' && stats.downloadsToday >= 1 && (
              <Link href="/upgrade" className="text-sm bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-lg text-white hover:opacity-90 transition">
                Upgrade for Unlimited Downloads 💎
              </Link>
            )}
          </div>

          {downloads.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-white mb-2">No Downloads Yet</h3>
              <p className="text-gray-400 mb-4">Start downloading videos to see them here!</p>
              <Link href="/watch" className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg transition">
                Browse Videos 🎬
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {downloads.map((download) => (
                <div key={download.id} className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 flex-wrap hover:bg-slate-700/50 transition">
                  <div className="text-3xl">{download.videoThumbnail || '🎬'}</div>
                  <div className="flex-1 min-w-[150px]">
                    <h3 className="font-semibold text-white">{download.videoTitle}</h3>
                    <div className="flex gap-4 text-xs text-gray-400 mt-1 flex-wrap">
                      <span>⏱️ {download.videoDuration}</span>
                      <span>📅 {new Date(download.downloadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePlayVideo(download)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-1"
                    >
                      ▶️ Play
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([`Video: ${download.videoTitle}\nDownloaded from VideoStream Pro\nDate: ${new Date(download.downloadedAt).toLocaleString()}`], 
                          { type: 'video/mp4' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${download.videoTitle.replace(/[^a-z0-9]/gi, '_')}.mp4`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-1"
                    >
                      📥 Download Again
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        {downloads.length > 0 && (
          <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
            <p className="text-blue-400 text-sm">
              💡 <strong>Tip:</strong> Click the Play button to watch any downloaded video directly from here!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}