'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

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
  const [downloadsLeft, setDownloadsLeft] = useState<number | string>('?');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsLoggedIn(true);
      const user = JSON.parse(savedUser);
      setUserPlan(user.plan || 'free');
    }
  }, []);

  const handleDownload = async () => {
    if (!isLoggedIn) {
      toast.error('Please login to download videos');
      window.location.href = '/login';
      return;
    }

    setDownloadStatus('downloading');
    setMessage('Preparing download...');

    const token = localStorage.getItem('token');

    try {
      console.log('📥 Sending download request for:', videoTitle);

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

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Please try again.');
      }

      const data = await response.json();
      console.log('📥 Download response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      if (data.success) {
        setDownloadStatus('success');
        setMessage(`✅ ${videoTitle} downloaded!`);
        toast.success(`${videoTitle} downloaded successfully!`);

        // Update user's downloaded videos in localStorage
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const user = JSON.parse(savedUser);
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
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Update downloads left
        if (data.downloadsLeft !== undefined) {
          setDownloadsLeft(data.downloadsLeft);
        }

        // Simulate file download (demo)
        const blob = new Blob([
          `Video: ${videoTitle}\n`,
          `Duration: ${videoDuration}\n`,
          `Downloaded from VideoStream Pro\n`,
          `Date: ${new Date().toLocaleString()}\n`
        ], { type: 'video/mp4' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${videoTitle.replace(/[^a-z0-9]/gi, '_')}.txt`;
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
      setMessage(error.message || 'Download failed. Please try again.');
      toast.error(error.message || 'Download failed');
      
      setTimeout(() => {
        setDownloadStatus('idle');
        setMessage('');
      }, 3000);
    }
  };

  const getButtonText = () => {
    if (downloadStatus === 'downloading') return '⏳ Downloading...';
    if (downloadStatus === 'success') return '✅ Downloaded!';
    return '📥 Download';
  };

  const getButtonClass = () => {
    if (downloadStatus === 'downloading') return 'bg-yellow-600 cursor-wait';
    if (downloadStatus === 'success') return 'bg-green-600';
    if (userPlan !== 'free') return 'bg-purple-600 hover:bg-purple-700';
    return 'bg-blue-600 hover:bg-blue-700';
  };

  const getLimitText = () => {
    if (userPlan !== 'free') return '✨ Unlimited downloads';
    if (downloadsLeft !== '?' && downloadsLeft !== undefined) {
      return `🆓 ${downloadsLeft} download${downloadsLeft === 1 ? '' : 's'} left today`;
    }
    return '🆓 1 download/day';
  };

  return (
    <div className="mt-3">
      <button
        onClick={handleDownload}
        disabled={downloadStatus === 'downloading'}
        className={`w-full ${getButtonClass()} text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50`}
      >
        {getButtonText()}
      </button>
      {message && (
        <p className={`text-xs mt-1 text-center ${downloadStatus === 'error' ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
      <p className="text-xs text-gray-400 text-center mt-1">
        {getLimitText()}
      </p>
    </div>
  );
}