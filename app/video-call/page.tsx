'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, getUser } from '@/lib/auth';
import VideoCall from '@/components/VideoCall';

export default function VideoCallPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // ✅ FIX: Load user from sessionStorage
  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (!token || !savedUser) {
      router.push('/login');
    } else {
      setUser(savedUser);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <Link href="/" className="text-xl font-bold text-white">🎬 VideoStream Pro</Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-300 hover:text-white">Home</Link>
            <Link href="/watch" className="text-gray-300 hover:text-white">Watch</Link>
            <Link href="/video-call" className="text-white">Video Call</Link>
            <Link href="/upgrade" className="text-gray-300 hover:text-white">Upgrade</Link>
            <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white">Hi, {user.username}</span>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm transition">Logout</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">📹 Video Call</h1>
        
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <p className="text-gray-400 text-sm">
                👤 Logged in as: <span className="text-white font-semibold">{user.username}</span>
              </p>
              <p className="text-gray-500 text-xs">
                📧 {user.email}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">🟢 Online</span>
            </div>
          </div>
          
          <VideoCall />
        </div>
      </main>
    </div>
  );
}