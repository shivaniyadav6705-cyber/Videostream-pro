'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<{
    startDate: string;
    endDate: string;
    daysLeft: number;
  } | null>(null);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return null;

  const getPlanBadge = () => {
    const plans: Record<string, { label: string; color: string }> = {
      gold: { label: '💎 Gold', color: 'bg-yellow-500 text-black' },
      silver: { label: '🥈 Silver', color: 'bg-gray-400 text-black' },
      bronze: { label: '🥉 Bronze', color: 'bg-amber-600 text-white' },
      free: { label: '🆓 Free', color: 'bg-gray-600 text-white' }
    };
    return plans[user.plan] || plans.free;
  };

  const planBadge = getPlanBadge();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar/>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          {/* Header */}
          <div className="flex items-center gap-6 flex-wrap mb-6">
            <div className="text-6xl">👤</div>
            <div>
              <h1 className="text-2xl font-bold text-white">{user.username}</h1>
              <p className="text-gray-400">{user.email}</p>
              <div className="flex gap-3 mt-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${planBadge.color}`}>
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
                <p className="text-xl font-bold text-white">{user.plan.toUpperCase()}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">Start Date</p>
                <p className="text-sm text-white">{planDetails?.startDate || 'N/A'}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                <p className="text-xs text-gray-400">Valid Until</p>
                <p className="text-sm text-white">{planDetails?.endDate || 'N/A'}</p>
                {planDetails && planDetails.daysLeft > 0 && (
                  <p className="text-xs text-green-400 mt-1">{planDetails.daysLeft} days remaining</p>
                )}
                {planDetails && planDetails.daysLeft <= 0 && user.plan !== 'free' && (
                  <p className="text-xs text-red-400 mt-1">⚠️ Expired - Please renew</p>
                )}
              </div>
            </div>
          </div>

          {/* Upgrade Button */}
          {user.plan === 'free' && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-4 text-center">
              <p className="text-white font-semibold">🚀 Upgrade to Premium for unlimited features!</p>
              <Link href="/upgrade" className="inline-block mt-2 bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
                View Plans
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}