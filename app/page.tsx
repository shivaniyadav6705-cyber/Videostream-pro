'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, getUser } from '@/lib/auth';
import Navbar from '@/components/Navbar';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  
  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (!token || !savedUser) {
      router.push('/login');
    } else {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const featuredVideos = [
    {
      id: 1,
      title: "🌿 Amazing Nature Documentary",
      description: "Explore the beauty of nature in stunning 4K quality. Watch rare wildlife footage from around the world including exotic animals and breathtaking landscapes.",
      views: "1.2M views",
      likes: "45K likes",
      date: "2 days ago",
      duration: "12:34",
      category: "Nature",
      icon: "🌿"
    },
    {
      id: 2,
      title: "💻 Tech Review 2026 - Latest Gadgets",
      description: "Complete review of the latest smartphones, laptops, and smartwatches. Find out which gadget is worth your money with our in-depth analysis.",
      views: "890K views",
      likes: "32K likes",
      date: "5 days ago",
      duration: "08:21",
      category: "Technology",
      icon: "💻"
    },
    {
      id: 3,
      title: "🎓 Complete React Tutorial 2026",
      description: "Learn React from scratch with this comprehensive tutorial. Build real-world projects and master hooks, state management, and Next.js integration.",
      views: "2.3M views",
      likes: "89K likes",
      date: "1 week ago",
      duration: "15:47",
      category: "Education",
      icon: "🎓"
    },
    {
      id: 4,
      title: "🎮 Gaming Highlights - Best Moments",
      description: "Epic gaming moments, clutch plays, and funny reactions. Watch the best gaming content from top streamers around the world.",
      views: "5.1M views",
      likes: "210K likes",
      date: "3 days ago",
      duration: "10:22",
      category: "Gaming",
      icon: "🎮"
    },
    {
      id: 5,
      title: "🍳 Cooking Masterclass - Italian Cuisine",
      description: "Learn to cook authentic Italian pasta, pizza, and desserts from a professional chef. Perfect for beginners and food enthusiasts.",
      views: "450K views",
      likes: "18K likes",
      date: "4 days ago",
      duration: "25:18",
      category: "Cooking",
      icon: "🍳"
    },
    {
      id: 6,
      title: "🏋️ Home Workout - 30 Days Challenge",
      description: "Transform your body with this 30-day home workout challenge. No equipment needed - just dedication and consistency.",
      views: "780K views",
      likes: "67K likes",
      date: "1 day ago",
      duration: "18:45",
      category: "Fitness",
      icon: "🏋️"
    },
    {
      id: 7,
      title: "🎵 Top 100 Songs 2026 Playlist",
      description: "The biggest hits of 2026 compiled in one playlist. Enjoy trending music from top artists around the globe.",
      views: "3.2M views",
      likes: "156K likes",
      date: "6 days ago",
      duration: "45:00",
      category: "Music",
      icon: "🎵"
    },
    {
      id: 8,
      title: "✈️ Travel Vlog - Exploring Japan",
      description: "Join me on an amazing journey through Tokyo, Kyoto, and Osaka. Discover hidden gems and local culture in Japan.",
      views: "620K views",
      likes: "41K likes",
      date: "2 weeks ago",
      duration: "22:10",
      category: "Travel",
      icon: "✈️"
    },
    {
      id: 9,
      title: "🎨 Digital Art Tutorial - Procreate",
      description: "Learn digital illustration from scratch. Master Procreate tools and create stunning artwork on your iPad.",
      views: "340K views",
      likes: "23K likes",
      date: "3 days ago",
      duration: "35:22",
      category: "Art",
      icon: "🎨"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navbar  />
      
      <main className="main-content">
        <div className="container">
          {/* Hero Section */}
          <div className="hero-section">
            <h1 className="hero-title">
              Welcome to <span className="gradient-text">VideoStream Pro</span>
            </h1>
            <p className="hero-subtitle">
              Stream, Connect, and Share - All in One Place
            </p>
            <div className="mt-6">
              <Link href="/watch" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg font-semibold transition">
                🎬 Start Watching Now
              </Link>
            </div>
          </div>

          { }
          <div className="bg-card rounded-xl p-4 mb-8 text-center border border-theme">
            <p className="text-gray-300">
              Welcome back, <strong className="text-primary">{user.username}</strong>! 
              Your current plan: <span className={`font-bold ${user.plan === 'gold' ? 'text-yellow-500' : user.plan === 'silver' ? 'text-gray-400' : user.plan === 'bronze' ? 'text-amber-600' : 'text-gray-500'}`}>
                {user.plan?.toUpperCase() || 'FREE'}
              </span>
            </p>
          </div>

          { }
          <div className="section-header">
            <h2>🔥 Featured Videos</h2>
            <p>Watch the most popular content</p>
          </div>

          { }
          <div className="video-grid">
            {featuredVideos.map((video) => (
              <Link href="/watch" key={video.id} className="video-card">
                <div className="video-thumbnail">
                  <span>{video.icon}</span>
                  <span className="video-duration">{video.duration}</span>
                </div>
                <div className="video-info">
                  <h3>{video.title}</h3>
                  <p>{video.description}</p>
                  <div className="video-meta">
                    <span>👁️ {video.views}</span>
                    <span>👍 {video.likes}</span>
                    <span>📅 {video.date}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          { }
          <div className="mt-12">
            <div className="section-header">
              <h2>📂 Browse by Category</h2>
              <p>Find videos that match your interest</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Nature', 'Technology', 'Education', 'Gaming', 'Cooking', 'Fitness', 'Music', 'Travel', 'Art'].map((category) => (
                <Link 
                  key={category}
                  href="/watch"
                  className="bg-card border border-theme rounded-xl p-4 text-center hover:scale-105 transition transform"
                >
                  <span className="text-2xl block mb-2">
                    {category === 'Nature' && '🌿'}
                    {category === 'Technology' && '💻'}
                    {category === 'Education' && '🎓'}
                    {category === 'Gaming' && '🎮'}
                    {category === 'Cooking' && '🍳'}
                    {category === 'Fitness' && '🏋️'}
                    {category === 'Music' && '🎵'}
                    {category === 'Travel' && '✈️'}
                    {category === 'Art' && '🎨'}
                  </span>
                  <span className="text-sm font-medium">{category}</span>
                </Link>
              ))}
            </div>
          </div>

          { }
          {user.plan === 'free' && (
            <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-center">
              <h3 className="text-xl font-bold text-white mb-2">✨ Upgrade to Premium ✨</h3>
              <p className="text-white/80 mb-4">Get unlimited watch time, ad-free experience, and exclusive content!</p>
              <Link href="/upgrade" className="inline-block bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                View Plans
              </Link>
            </div>
          )}
        </div>
      </main>

      { }
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>🎬 VideoStream Pro</h3>
            <p>Your premium video streaming platform</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link href="/">Home</Link>
            <Link href="/watch">Watch</Link>
            <Link href="/upgrade">Upgrade</Link>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📧 support@videostream.com</p>
            <p>📞 +1 234 567 8900</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 VideoStream Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}