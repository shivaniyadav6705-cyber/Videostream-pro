'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getToken, getUser } from '@/lib/auth';

interface Comment {
  _id: string;
  videoId: string;
  userId: number;
  username: string;
  text: string;
  city: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  removed: boolean;
  language: string;
}

interface CommentsProps {
  videoId: string;
}

// Get user's city from IP (using free API)
const getUserCity = async (): Promise<string> => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data.city || data.region || 'Unknown';
  } catch {
    return 'Unknown';
  }
};

// Simple translation function (using free API)
const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (targetLang === 'en') return text;
  
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
    const data = await res.json();
    return data.responseData.translatedText || text;
  } catch {
    return text;
  }
};

export default function Comments({ videoId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userCity, setUserCity] = useState('Unknown');
  const [translateLang, setTranslateLang] = useState('en');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी (Hindi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  // ✅ FIX: Load user data and city from sessionStorage
  useEffect(() => {
    const savedUser = getUser();
    const token = getToken();
    
    if (savedUser && token) {
      setUser(savedUser);
      setIsLoggedIn(true);
    }
    
    getUserCity().then(setUserCity);
    loadComments();
    
    // Refresh comments every 10 seconds to show new ones
    const interval = setInterval(loadComments, 10000);
    return () => clearInterval(interval);
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments?videoId=${videoId}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    // Check for special characters
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (specialChars.test(newComment)) {
      toast.error('Comments cannot contain special characters like !@#$%^&*');
      return;
    }

    if (!isLoggedIn) {
      toast.error('Please login to comment');
      return;
    }

    setLoading(true);

    try {
      // ✅ FIX: Get token from sessionStorage
      const token = getToken();
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId,
          text: newComment,
          city: userCity,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNewComment('');
        await loadComments();
        toast.success('Comment posted!');
      } else {
        toast.error(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    }
    setLoading(false);
  };

  const handleLike = async (commentId: string) => {
    if (!isLoggedIn) {
      toast.error('Please login to like comments');
      return;
    }

    try {
      // ✅ FIX: Get token from sessionStorage
      const token = getToken();
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        await loadComments();
        toast.success('Liked!');
      } else {
        toast.error(data.error || 'Failed to like');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like');
    }
  };

  const handleDislike = async (commentId: string) => {
    if (!isLoggedIn) {
      toast.error('Please login to dislike comments');
      return;
    }

    try {
      // ✅ FIX: Get token from sessionStorage
      const token = getToken();
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        await loadComments();
        if (data.removed) {
          toast.error('Comment removed due to 2 dislikes');
        } else {
          toast.success('Disliked!');
        }
      } else {
        toast.error(data.error || 'Failed to dislike');
      }
    } catch (error) {
      console.error('Error disliking comment:', error);
      toast.error('Failed to dislike');
    }
  };

  const handleTranslate = async (commentId: string, text: string) => {
    if (translateLang === 'en') {
      // If English selected, remove translation
      const updated = { ...translations };
      delete updated[commentId];
      setTranslations(updated);
      return;
    }
    
    // Check if already translated to this language
    if (translations[commentId]) {
      // Remove translation if already shown
      const updated = { ...translations };
      delete updated[commentId];
      setTranslations(updated);
      return;
    }
    
    const translated = await translateText(text, translateLang);
    setTranslations(prev => ({ ...prev, [commentId]: translated }));
    toast.success(`Translated to ${languages.find(l => l.code === translateLang)?.name}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isTranslated = (commentId: string) => {
    return translations[commentId] !== undefined;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 mt-6 border border-slate-700">
      <h3 className="text-xl font-semibold text-white mb-4">
        💬 Comments ({comments.length})
      </h3>

      {/* Language Selector for Translation */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-gray-400">🌐 Translate comments to:</span>
        <select
          value={translateLang}
          onChange={(e) => setTranslateLang(e.target.value)}
          className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>
      </div>

      {/* Comment Input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isLoggedIn ? "Write a comment... (No special characters allowed)" : "Please login to comment"}
          disabled={!isLoggedIn}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
        />
        <button
          onClick={handlePostComment}
          disabled={!isLoggedIn || loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>

      {/* Login prompt if not logged in */}
      {!isLoggedIn && (
        <div className="text-center text-sm text-gray-400 mb-4">
          🔐 <a href="/login" className="text-blue-400 hover:underline">Login</a> to post, like, and dislike comments
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="bg-slate-700/50 rounded-lg p-4">
              {/* Comment Header */}
              <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-400">
                    {comment.username}
                  </span>
                  <span className="text-xs text-gray-400">
                    📍 {comment.city}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>

              {/* Comment Text with Translation */}
              <div className="mb-3">
                <p className="text-gray-200">
                  {isTranslated(comment._id) ? translations[comment._id] : comment.text}
                </p>
                {isTranslated(comment._id) && (
                  <button
                    onClick={() => {
                      const updated = { ...translations };
                      delete updated[comment._id];
                      setTranslations(updated);
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                  >
                    Show original
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => handleLike(comment._id)}
                  disabled={!isLoggedIn}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-green-400 transition disabled:opacity-50"
                >
                  👍 {comment.likes}
                </button>
                <button
                  onClick={() => handleDislike(comment._id)}
                  disabled={!isLoggedIn}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-red-400 transition disabled:opacity-50"
                >
                  👎 {comment.dislikes}
                </button>
                <button
                  onClick={() => handleTranslate(comment._id, comment.text)}
                  className={`flex items-center gap-1 text-sm transition ${
                    isTranslated(comment._id) ? 'text-blue-400' : 'text-gray-300 hover:text-blue-400'
                  }`}
                >
                  🌐 {isTranslated(comment._id) ? 'Hide Translation' : 'Translate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stats Footer */}
      {comments.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center border-t border-slate-700 pt-3">
          {comments.length} comments • 
          {comments.reduce((sum, c) => sum + c.likes, 0)} total likes •
          Comments with 2+ dislikes are automatically removed
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}