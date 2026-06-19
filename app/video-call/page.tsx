'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VideoCallPage() {
  const [user, setUser] = useState<any>(null);
  const [meetingId, setMeetingId] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (!token || !savedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const createMeeting = () => {
    const newId = Math.random().toString(36).substring(2, 10);
    setMeetingId(newId);
    setIsInCall(true);
    window.open(`https://meet.google.com/new`, '_blank');
  };

  const joinMeeting = () => {
    if (meetingId) {
      setIsInCall(true);
      window.open(`https://meet.google.com/${meetingId}`, '_blank');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <Link href="/" className="text-xl font-bold text-white">🎬 VideoStream Pro</Link>
          <div className="flex gap-6">
            <Link href="/watch" className="text-gray-300 hover:text-white transition">Watch</Link>
            <Link href="/video-call" className="text-white transition">Video Call</Link>
            <Link href="/upgrade" className="text-gray-300 hover:text-white transition">Upgrade</Link>
            <Link href="/profile" className="text-gray-300 hover:text-white transition">Profile</Link>
          </div>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm transition">Logout</button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">📹 Google Meet Video Call</h1>
        
        {!isInCall ? (
          <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-2xl font-semibold text-white mb-4">Start or Join a Meeting</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={createMeeting} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition">
                Create New Meeting
              </button>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Meeting ID"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value)}
                  className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder-gray-400 w-64"
                />
                <button onClick={joinMeeting} disabled={!meetingId} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50">
                  Join
                </button>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-left">
              <p className="text-blue-300 font-semibold mb-2">💡 Features:</p>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• <strong>Screen Sharing:</strong> Click "Share Screen" → Select YouTube tab → Watch together!</li>
                <li>• <strong>Recording:</strong> Use Chrome extension or OBS to record calls</li>
                <li>• HD Video & Audio quality</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-600">
              <iframe
                src={`https://meet.google.com/${meetingId || 'new'}`}
                className="w-full h-full"
                allow="camera; microphone; display-capture"
                title="Google Meet"
              />
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => setIsInCall(false)} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg transition">
                🔴 End Call
              </button>
              <p className="mt-3 text-gray-400 text-sm">
                Meeting ID: <span className="text-blue-400 font-mono">{meetingId}</span>
                <button onClick={() => navigator.clipboard.writeText(meetingId)} className="ml-2 text-blue-400 hover:text-blue-300">📋 Copy</button>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}