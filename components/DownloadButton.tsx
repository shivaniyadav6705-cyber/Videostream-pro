'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getToken, getUser, setUser } from '@/lib/auth';

interface DownloadButtonProps {
  videoId: string;
  videoTitle: string;
  videoDuration?: string;
  videoThumbnail?: string;
}

export default function DownloadButton({ 
  videoId, 
  videoTitle, 
  videoDuration = "10:00",
  videoThumbnail = "🎬"
}: DownloadButtonProps) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [userPlan, setUserPlan] = useState<string>('free');
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (token && savedUser) {
      setIsLoggedIn(true);
      setUserPlan(savedUser.plan || 'free');
    }
  }, []);

  const handleDownload = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to download videos');
      window.location.href = '/login';
      return;
    }

    setDownloadStatus('downloading');
    setMessage('Processing download...');

    
    const token = getToken();

    try {
      console.log('📥 Downloading:', videoTitle);

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId,
          videoTitle,
          videoDuration,
          videoThumbnail,
        }),
      });

      const data = await response.json();
      console.log('📥 Download response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      if (data.success) {
        setDownloadStatus('success');
        setMessage(`✅ ${videoTitle} downloaded!`);
        toast.success(`${videoTitle} downloaded!`);

       
        const savedUser = getUser();
        if (savedUser) {
          const user = savedUser;
          
          const newDownload = {
            id: Date.now(),
            videoId,
            videoTitle,
            videoDuration,
            videoThumbnail,
            downloadedAt: new Date().toISOString(),
          };
          const updatedDownloads = [newDownload, ...(user.downloadedVideos || [])];
          user.downloadedVideos = updatedDownloads;
          user.downloadsToday = data.downloadsToday || 0;
          setUser(user);
        }

        
        const videoContent = `
          Video: ${videoTitle}
          Duration: ${videoDuration}
          Downloaded from VideoStream Pro
          Date: ${new Date().toLocaleString()}
        `;
        
        const blob = new Blob([videoContent], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_')}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setTimeout(() => {
          setDownloadStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        throw new Error(data.error || 'Download failed');
      }
    } catch (error: any) {
      console.error('❌ Download error:', error);
      setDownloadStatus('error');
      setMessage(error.message || 'Download failed');
      toast.error(error.message || 'Download failed');
      
      setTimeout(() => {
        setDownloadStatus('idle');
        setMessage('');
      }, 3000);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={handleDownload}
        disabled={downloadStatus === 'downloading'}
        className={`w-full ${downloadStatus === 'downloading' ? 'bg-yellow-600 cursor-wait' : downloadStatus === 'success' ? 'bg-green-600' : userPlan !== 'free' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50`}
      >
        {downloadStatus === 'downloading' ? '⏳ Downloading...' : downloadStatus === 'success' ? '✅ Downloaded!' : '📥 Download'}
      </button>
      {message && (
        <p className={`text-xs mt-1 text-center ${downloadStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}