'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  plan: string;
  planStartDate?: string;
  planEndDate?: string;
  createdAt: string;
  downloadsToday?: number;
  downloadedVideos?: any[];
}

interface Download {
  id: number;
  videoId: string;
  videoTitle: string;
  videoDuration: string;
  videoThumbnail: string;
  downloadedAt: string;
}

interface PlanDetails {
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [stats, setStats] = useState({
    downloadsToday: 0,
    totalDownloads: 0,
    plan: 'free',
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) {
      router.push('/login');
    } else {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      fetchUserDetails(token);
      fetchDownloads(token);
    }
    setLoading(false);
  }, []);

  const fetchUserDetails = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Calculate plan dates
        if (data.user.planStartDate && data.user.planEndDate) {
          const start = new Date(data.user.planStartDate);
          const end = new Date(data.user.planEndDate);
          const now = new Date();
          const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          setPlanDetails({
            startDate: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            endDate: end.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
            daysLeft: Math.max(0, daysLeft)
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchDownloads = async (token: string) => {
    try {
      console.log('📥 Fetching downloads...');
      
      const res = await fetch('/api/download', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('❌ Non-JSON response:', text.substring(0, 200));
        return;
      }
      
      const data = await res.json();
      console.log('📥 Downloads response:', data);
      
      if (data.success) {
        setDownloads(data.downloads || []);
        setStats({
          downloadsToday: data.downloadsToday || 0,
          totalDownloads: data.downloads?.length || 0,
          plan: data.plan || 'free',
        });
        console.log(`✅ Loaded ${data.downloads?.length || 0} downloads`);
      } else {
        console.error('❌ Failed to fetch downloads:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to fetch downloads:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
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
        {/* Profile Card */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          {/* Header */}
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
              <p className="text-2xl font-bold text-white uppercase">{user.plan}</p>
              <p className="text-xs text-gray-400">Current Plan</p>
            </div>
          </div>

          {/* Plan Details */}
          <div className="bg-slate-700/50 rounded-xl p-6 mb-6 border border-slate-600">
            <h2 className="text-lg font-semibold text-white mb-4">📋 Plan Details</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">Current Plan</p>
                <p className="text-xl font-bold text-white uppercase">{user.plan}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">Start Date</p>
                <p className="text-sm text-white">{planDetails?.startDate || 'N/A'}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">Valid Until</p>
                <p className="text-sm text-white">{planDetails?.endDate || 'N/A'}</p>
                {planDetails && planDetails.daysLeft > 0 && user.plan !== 'free' && (
                  <p className="text-xs text-green-400 mt-1">{planDetails.daysLeft} days remaining</p>
                )}
                {planDetails && planDetails.daysLeft <= 0 && user.plan !== 'free' && (
                  <p className="text-xs text-red-400 mt-1">⚠️ Expired - Please renew</p>
                )}
                {user.plan === 'free' && (
                  <p className="text-xs text-yellow-400 mt-1">Upgrade to unlock premium</p>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          {user.plan === 'free' && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-center mb-6">
              <p className="text-white font-semibold">🚀 Upgrade to Premium for unlimited features!</p>
              <Link href="/upgrade" className="inline-block mt-2 bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
                View Plans
              </Link>
            </div>
          )}

          {/* Downloads Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-white">📥 Downloads</h2>
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
                {downloads.map((download: Download) => (
                  <div key={download.id} className="bg-slate-700/30 rounded-lg p-3 flex justify-between items-center hover:bg-slate-700/50 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{download.videoThumbnail || '🎬'}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{download.videoTitle}</p>
                        <div className="flex gap-3 text-xs text-gray-400">
                          <span>⏱️ {download.videoDuration}</span>
                          <span>📅 {formatDate(download.downloadedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          toast.success(`Playing: ${download.videoTitle}`);
                        }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white transition"
                      >
                        ▶️ Play
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}