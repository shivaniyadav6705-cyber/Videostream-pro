'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Comment {
  id: number;
  videoId: string;
  userId: number;
  username: string;
  text: string;
  city: string;
  likes: number;
  dislikes: number;
  createdAt: string;
  removed: boolean;
}

interface CommentsProps {
  videoId: string;
}

// In-memory comments storage (shared across components)
let globalComments: Comment[] = [];
let nextCommentId = 1;

// Get user's city from IP (demo - in production use real IP geolocation)
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
    // Using free MyMemory translation API
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
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [showTranslateFor, setShowTranslateFor] = useState<number | null>(null);

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

  // Load user data
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    getUserCity().then(setUserCity);
    loadComments();
  }, [videoId]);

  const loadComments = () => {
    const videoComments = globalComments.filter(c => c.videoId === videoId && !c.removed);
    videoComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setComments(videoComments);
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

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    setLoading(true);

    const newCommentObj: Comment = {
      id: nextCommentId++,
      videoId,
      userId: user.id,
      username: user.username,
      text: newComment,
      city: userCity,
      likes: 0,
      dislikes: 0,
      createdAt: new Date().toISOString(),
      removed: false
    };

    globalComments.push(newCommentObj);
    setNewComment('');
    loadComments();
    toast.success('Comment posted!');
    setLoading(false);
  };

  const handleLike = async (commentId: number) => {
    if (!user) {
      toast.error('Please login to like comments');
      return;
    }

    const commentIndex = globalComments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      globalComments[commentIndex].likes += 1;
      loadComments();
      toast.success('Liked!');
    }
  };

  const handleDislike = async (commentId: number) => {
    if (!user) {
      toast.error('Please login to dislike comments');
      return;
    }

    const commentIndex = globalComments.findIndex(c => c.id === commentId);
    if (commentIndex !== -1) {
      globalComments[commentIndex].dislikes += 1;
      
      // Auto-remove if 2 or more dislikes
      if (globalComments[commentIndex].dislikes >= 2) {
        globalComments[commentIndex].removed = true;
        toast.error('Comment removed due to 2 dislikes');
      }
      loadComments();
    }
  };

  const handleTranslate = async (commentId: number, text: string) => {
    if (translateLang === 'en') {
      setShowTranslateFor(null);
      return;
    }
    
    setShowTranslateFor(commentId);
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
          placeholder="Write a comment... (No special characters allowed)"
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
        />
        <button
          onClick={handlePostComment}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>

      {/* Comments List */}
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-slate-700/50 rounded-lg p-4">
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
                  {showTranslateFor === comment.id && translations[comment.id]
                    ? translations[comment.id]
                    : comment.text}
                </p>
                {showTranslateFor === comment.id && translations[comment.id] && (
                  <button
                    onClick={() => setShowTranslateFor(null)}
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                  >
                    Show original
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-green-400 transition"
                >
                  👍 {comment.likes}
                </button>
                <button
                  onClick={() => handleDislike(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-red-400 transition"
                >
                  👎 {comment.dislikes}
                </button>
                <button
                  onClick={() => handleTranslate(comment.id, comment.text)}
                  className="flex items-center gap-1 text-sm text-gray-300 hover:text-blue-400 transition"
                >
                  🌐 Translate
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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