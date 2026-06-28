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

interface PlanDetails {
  startDate: string;
  endDate: string;
  daysLeft: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [downloads, setDownloads] = useState<any[]>([]);
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
      const res = await fetch('/api/download', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDownloads(data.downloads || []);
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
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
                <span className="text-xs text-gray-400">📅 Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
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
            <h2 className="text-lg font-semibold text-white mb-4">📥 Downloads ({downloads.length})</h2>
            {downloads.length === 0 ? (
              <p className="text-gray-400 text-sm">No downloads yet. Start watching and download your favorite videos!</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {downloads.slice(0, 5).map((download: any) => (
                  <div key={download.id} className="bg-slate-700/30 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-white text-sm">{download.videoTitle}</p>
                      <p className="text-xs text-gray-400">{new Date(download.downloadedAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-gray-500">📥 {download.videoDuration}</span>
                  </div>
                ))}
                {downloads.length > 5 && (
                  <p className="text-xs text-gray-400 text-center">+ {downloads.length - 5} more downloads</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}