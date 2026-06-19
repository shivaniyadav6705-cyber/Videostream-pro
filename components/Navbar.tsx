'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  username: string;
  email: string;
  plan: string;
}

interface Location {
  city: string;
  state: string;
  isSouthIndia: boolean;
  theme: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [theme, setTheme] = useState<string>('dark');
  const router = useRouter();
  const pathname = usePathname();

  // Load user and theme
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Fetch real location on mount
  useEffect(() => {
    fetch('/api/auth/location')
      .then(res => res.json())
      .then(data => {
        console.log('📍 Navbar location received:', data);
        setLocation(data);
        // Apply theme based on location if not manually set
        if (data.theme && !localStorage.getItem('theme')) {
          setTheme(data.theme);
          document.documentElement.setAttribute('data-theme', data.theme);
          localStorage.setItem('theme', data.theme);
        }
      })
      .catch(err => console.error('Location fetch failed:', err));
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toast.success(`${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const getPlanBadge = () => {
    if (!user) return null;
    const plans: Record<string, { label: string; className: string }> = {
      gold: { label: '💎 Gold', className: 'bg-yellow-500 text-black' },
      silver: { label: '🥈 Silver', className: 'bg-gray-400 text-black' },
      bronze: { label: '🥉 Bronze', className: 'bg-amber-600 text-white' },
      free: { label: '🆓 Free', className: 'bg-gray-600 text-white' }
    };
    return plans[user.plan] || plans.free;
  };

  const planBadge = getPlanBadge();

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white">
          🎬 VideoStream Pro
        </Link>
        
        {/* Navigation Links */}
        <div className="flex gap-6">
          <Link href="/" className={`${pathname === '/' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}>Home</Link>
          <Link href="/watch" className={`${pathname === '/watch' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}>Watch</Link>
          <Link href="/video-call" className={`${pathname === '/video-call' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}>Video Call</Link>
          <Link href="/upgrade" className={`${pathname === '/upgrade' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}>Upgrade</Link>
          <Link href="/profile" className={`${pathname === '/profile' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}>Profile</Link>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Real Location Display */}
          {location && (
            <div className="hidden md:flex items-center gap-1 text-xs bg-slate-800/50 px-3 py-1.5 rounded-full">
              <span>📍</span>
              <span className="text-gray-300">{location.city}, {location.state}</span>
              {location.isSouthIndia ? (
                <span className="text-green-400 ml-1" title="South India - Email OTP">🌞 South India</span>
              ) : (
                <span className="text-blue-400 ml-1" title="Other Region - SMS OTP">🌍 Other</span>
              )}
            </div>
          )}
          
          {/* Theme Toggle Button */}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-xl"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          {/* User Section */}
          {user ? (
            <>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${planBadge?.className}`}>
                {planBadge?.label}
              </span>
              <span className="text-white hidden sm:inline">Hi, {user.username}</span>
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm transition">
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm transition">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}