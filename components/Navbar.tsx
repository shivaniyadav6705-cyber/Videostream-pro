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
  phone?: string;
}

interface Location {
  city: string;
  state: string;
  isSouthIndia: boolean;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [theme, setTheme] = useState<string>('dark');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Load user and theme from localStorage on mount
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

  // ============================================
  // CLIENT-SIDE LOCATION DETECTION
  // Works on both localhost and Vercel
  // ============================================
  useEffect(() => {
    async function getClientLocation() {
      try {
        // Check if we have cached location
        const cached = localStorage.getItem('userLocation');
        if (cached) {
          const parsed = JSON.parse(cached);
          setLocation(parsed);
          return;
        }

        // Try browser geolocation first (most accurate)
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
              });
            });
            
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const data = await response.json();
            
            const state = data.principalSubdivision || 'Unknown';
            const city = data.city || data.locality || 'Unknown';
            const southStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
            const isSouthIndia = southStates.some(s => state.includes(s));
            
            const locationData = { city, state, isSouthIndia };
            setLocation(locationData);
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            
            // Apply theme based on location
            const now = new Date();
            const istHour = (now.getUTCHours() + 5 + 30/60) % 24;
            const isSpecialTime = istHour >= 10 && istHour < 12;
            const theme = (isSouthIndia && isSpecialTime) ? 'light' : 'dark';
            
            if (!localStorage.getItem('theme')) {
              document.documentElement.setAttribute('data-theme', theme);
              localStorage.setItem('theme', theme);
              setTheme(theme);
            }
            
            console.log('📍 Location (Geolocation):', locationData);
            return;
          } catch (geoError) {
            console.log('Geolocation failed, using IP fallback');
          }
        }

        // Fallback: Use IP-based detection
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const state = data.region || 'Unknown';
        const city = data.city || 'Unknown';
        const southStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];
        const isSouthIndia = southStates.some(s => state.includes(s));
        
        const locationData = { city, state, isSouthIndia };
        setLocation(locationData);
        localStorage.setItem('userLocation', JSON.stringify(locationData));
        
        console.log('📍 Location (IP):', locationData);
        
      } catch (error) {
        console.error('Location detection failed:', error);
        // Default location fallback
        setLocation({ city: 'Mumbai', state: 'Maharashtra', isSouthIndia: false });
      }
    }
    
    getClientLocation();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('theme');
    localStorage.removeItem('userLocation');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    toast.success(`${newTheme === 'dark' ? '🌙 Dark' : '☀️ Light'} mode activated`);
  };

  const getPlanBadge = () => {
    if (!user) return null;
    const plans: Record<string, string> = {
      gold: '💎 Gold',
      silver: '🥈 Silver',
      bronze: '🥉 Bronze',
      free: '🆓 Free'
    };
    return plans[user.plan] || '🆓 Free';
  };

  const getPlanColor = () => {
    if (!user) return 'bg-gray-600';
    const colors: Record<string, string> = {
      gold: 'bg-yellow-500 text-black',
      silver: 'bg-gray-400 text-black',
      bronze: 'bg-amber-600 text-white',
      free: 'bg-gray-600 text-white'
    };
    return colors[user.plan] || 'bg-gray-600 text-white';
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 px-6 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white hover:text-blue-400 transition">
          🎬 VideoStream Pro
        </Link>
        
        {/* Navigation Links */}
        <div className="flex gap-6">
          <Link 
            href="/" 
            className={`${pathname === '/' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}
          >
            Home
          </Link>
          <Link 
            href="/watch" 
            className={`${pathname === '/watch' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}
          >
            Watch
          </Link>
          <Link 
            href="/video-call" 
            className={`${pathname === '/video-call' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}
          >
            Video Call
          </Link>
          <Link 
            href="/upgrade" 
            className={`${pathname === '/upgrade' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}
          >
            Upgrade
          </Link>
          <Link 
            href="/profile" 
            className={`${pathname === '/profile' ? 'text-white' : 'text-gray-300'} hover:text-white transition`}
          >
            Profile
          </Link>
        </div>
        
        {/* Right Section: Location, Theme, User */}
        <div className="flex items-center gap-4">
          {/* Location Display - Works on Vercel */}
          {location && (
            <div className="hidden md:flex items-center gap-1 text-xs bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700">
              <span>📍</span>
              <span className="text-gray-300">{location.city}</span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-300">{location.state}</span>
              {location.isSouthIndia ? (
                <span className="text-green-400 ml-1" title="South India - Email OTP">🌞</span>
              ) : (
                <span className="text-blue-400 ml-1" title="Other Region - SMS OTP">🌍</span>
              )}
            </div>
          )}
          
          {/* Theme Toggle Button */}
          <button
            onClick={handleThemeToggle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-xl border border-slate-700"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          
          {/* User Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1.5 hover:bg-slate-700 transition border border-slate-700"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPlanColor()}`}>
                  {getPlanBadge()}
                </span>
                <span className="text-sm font-medium text-white max-w-[100px] truncate">{user.username}</span>
                <span className={`text-xs text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/50">
                      <p className="text-sm font-semibold text-white">{user.username}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>👤</span> My Profile
                    </Link>
                    
                    <Link
                      href="/upgrade"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span>💎</span> Upgrade Plan
                    </Link>
                    
                    <hr className="border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition"
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition"
            >
              🔐 Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}