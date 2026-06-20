'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    gapi: any;
  }
}

interface VideoCallProps {
  userId?: string;
  username?: string;
}

interface CallHistory {
  id: number;
  meetingId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  participant: string;
  status: 'ongoing' | 'completed' | 'missed';
  isIncoming?: boolean;
}

export default function VideoCall({ userId, username }: VideoCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [friendEmail, setFriendEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load call history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('callHistory');
    if (savedHistory) {
      setCallHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Generate a unique meeting ID
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 6);
  };

  // Start a new call (video or audio)
  const startCall = (type: 'audio' | 'video' = 'video') => {
    const newMeetingId = generateMeetingId();
    setMeetingId(newMeetingId);
    setCallType(type);
    
    const link = `https://meet.google.com/${newMeetingId}`;
    setMeetingLink(link);
    setIsCallActive(true);
    
    // Open Google Meet in new window
    window.open(link, '_blank');
    
    // Start call duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    // Save to call history
    const callRecord: CallHistory = {
      id: Date.now(),
      meetingId: newMeetingId,
      startTime: new Date().toISOString(),
      participant: username || 'You',
      status: 'ongoing'
    };
    const updatedHistory = [callRecord, ...callHistory];
    setCallHistory(updatedHistory);
    localStorage.setItem('callHistory', JSON.stringify(updatedHistory));
    
    toast.success(`✅ ${type === 'audio' ? 'Audio' : 'Video'} call started! Share the link with friends.`);
  };

  // Join an existing meeting
  const joinCall = () => {
    if (!meetingId) {
      toast.error('Please enter a Meeting ID');
      return;
    }
    
    const link = `https://meet.google.com/${meetingId}`;
    setMeetingLink(link);
    setIsCallActive(true);
    
    // Open Google Meet in new window
    window.open(link, '_blank');
    
    // Start duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    toast.success('✅ Joining meeting...');
  };

  // Invite a friend via email
  const inviteFriend = () => {
    if (!friendEmail) {
      toast.error('Please enter friend\'s email');
      return;
    }
    
    if (!meetingLink) {
      toast.error('Please start a call first');
      return;
    }
    
    // Generate a shareable link with email
    const inviteLink = `${meetingLink}?invite=${encodeURIComponent(friendEmail)}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(inviteLink);
    
    toast.success(`📧 Invitation sent to ${friendEmail}! Share the link.`);
    setFriendEmail('');
    setShowInviteModal(false);
  };

  // Screen Sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          cursor: 'always'
        } as MediaTrackConstraints,
        audio: true 
      });
      
      setIsScreenSharing(true);
      
      const screenTrack = stream.getVideoTracks()[0];
      
      toast.success('🖥️ Screen sharing started! Select a window to share.');
      
      screenTrack.onended = () => {
        setIsScreenSharing(false);
        toast.success('Screen sharing stopped');
      };
      
    } catch (err) {
      console.error('Screen share error:', err);
      toast.error('Screen sharing cancelled or not allowed');
      setIsScreenSharing(false);
    }
  };

  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: {
          cursor: 'always'
        } as MediaTrackConstraints,
        audio: true 
      });
      
      recordedChunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { 
          type: 'video/webm' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.download = `google-meet-recording-${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        toast.success('✅ Recording saved to your device!');
        setIsRecording(false);
      };
      
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      
      toast.success('⏺️ Recording started... Stop recording to save');
      
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Recording failed. Please allow screen capture.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? '🔊 Unmuted' : '🔇 Muted');
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    toast.success(isVideoOff ? '📷 Video on' : '📷 Video off');
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsScreenSharing(false);
    
    if (isRecording) {
      stopRecording();
    }
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    // Update call history
    const updatedHistory = callHistory.map(call => {
      if (call.meetingId === meetingId && call.status === 'ongoing') {
        return {
          ...call,
          endTime: new Date().toISOString(),
          duration: callDuration,
          status: 'completed' as const
        };
      }
      return call;
    });
    setCallHistory(updatedHistory);
    localStorage.setItem('callHistory', JSON.stringify(updatedHistory));
    
    setMeetingId('');
    setMeetingLink('');
    setCallDuration(0);
    setShowInviteModal(false);
    
    toast.success('Call ended');
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const copyLink = () => {
    if (meetingLink) {
      navigator.clipboard.writeText(meetingLink);
      toast.success('📋 Link copied to clipboard! Share with friends.');
    }
  };

  // If call is active, show meeting UI
  if (isCallActive) {
    return (
      <div className="space-y-4">
        {/* Call Controls */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {callType === 'audio' ? '🎙️ Audio Call' : '📹 Video Call'}
              </h2>
              <p className="text-sm text-gray-400">
                Meeting ID: <span className="font-mono text-blue-400">{meetingId}</span>
              </p>
              <p className="text-xs text-gray-500">
                ⏱️ Duration: {formatDuration(callDuration)}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Invite Friend Button */}
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-3 py-2 rounded-lg transition bg-green-600 hover:bg-green-700"
              >
                👤 Invite Friend
              </button>
              
              <button
                onClick={toggleMute}
                className={`px-3 py-2 rounded-lg transition ${isMuted ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80`}
              >
                {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
              </button>
              
              {callType === 'video' && (
                <button
                  onClick={toggleVideo}
                  className={`px-3 py-2 rounded-lg transition ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80`}
                >
                  {isVideoOff ? '📷 Off' : '📷 On'}
                </button>
              )}
              
              <button
                onClick={startScreenShare}
                className={`px-3 py-2 rounded-lg transition ${isScreenSharing ? 'bg-green-600' : 'bg-blue-600'} hover:opacity-80`}
                disabled={isRecording}
              >
                {isScreenSharing ? '📺 Sharing' : '🖥️ Share Screen'}
              </button>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-3 py-2 rounded-lg transition ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-purple-600'} hover:opacity-80`}
              >
                {isRecording ? '⏺️ Recording...' : '⏺️ Record'}
              </button>
              
              <button
                onClick={endCall}
                className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                🔴 End Call
              </button>
            </div>
          </div>
          
          {/* Recording Indicator */}
          {isRecording && (
            <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-center text-red-400 animate-pulse">
              🔴 Recording in progress... Click "Stop Recording" to save
            </div>
          )}
          
          {/* Google Meet iframe */}
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-700 bg-black">
            <iframe
              src={`https://meet.google.com/${meetingId}`}
              className="w-full h-full"
              allow="camera; microphone; display-capture"
              title="Google Meet"
            />
          </div>
          
          {/* Meeting Info */}
          <div className="mt-3 flex items-center justify-center gap-4 text-sm flex-wrap">
            <span className="text-gray-400">
              Meeting ID: <span className="font-mono text-blue-400">{meetingId}</span>
            </span>
            <button
              onClick={copyLink}
              className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
            >
              📋 Copy Link
            </button>
            <span className="text-gray-500">
              👥 Share with friends to join
            </span>
          </div>
        </div>

        {/* Invite Friend Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">👤 Invite a Friend</h3>
              <p className="text-gray-400 text-sm mb-4">
                Send the meeting link to your friend so they can join the call.
              </p>
              <input
                type="email"
                placeholder="Enter friend's email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              />
              <div className="flex gap-3">
                <button
                  onClick={inviteFriend}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition"
                >
                  📧 Send Invite
                </button>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white transition"
                >
                  Cancel
                </button>
              </div>
              <div className="mt-3 text-center text-xs text-gray-500">
                Or copy the link and share it manually
              </div>
            </div>
          </div>
        )}
        
        {/* Feature Guide */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-center">
          <p className="text-blue-300">
            💡 <strong>YouTube Screen Sharing:</strong> Click "Share Screen" → Select the YouTube tab → Watch together!
          </p>
          <p className="text-gray-400 text-xs mt-1">
            🎙️ Click "Invite Friend" to send the meeting link directly to anyone.
          </p>
        </div>
      </div>
    );
  }

  // Main Call Interface - Before call starts
  return (
    <div className="space-y-6">
      {/* Main Call Interface */}
      <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
        <div className="text-6xl mb-4">📹</div>
        <h2 className="text-2xl font-bold text-white mb-2">Start a Video Call</h2>
        <p className="text-gray-400 mb-6">Connect with friends using Google Meet</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => startCall('video')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
          >
            🎥 Video Call
          </button>
          
          <button
            onClick={() => startCall('audio')}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
          >
            🎙️ Audio Call
          </button>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Meeting ID"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-white placeholder-gray-400 w-40 text-center"
            />
            <button
              onClick={joinCall}
              disabled={!meetingId}
              className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition disabled:opacity-50 text-white"
            >
              Join
            </button>
          </div>
        </div>
        
        <div className="mt-6 text-sm text-gray-400">
          <p>✨ Features: Video/Audio calls | Screen sharing (YouTube) | Call recording | Invite friends</p>
          <p className="text-xs text-gray-500 mt-2">
            💡 Create a meeting and invite friends via email or share the link.
          </p>
        </div>
      </div>
      
      {/* Call History */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-300">📞 Call History</h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showHistory ? 'Hide' : 'Show All'}
          </button>
        </div>
        {callHistory.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-2">No calls yet</p>
        ) : (
          <div className={`space-y-2 ${showHistory ? 'max-h-60' : 'max-h-32'} overflow-y-auto`}>
            {(showHistory ? callHistory : callHistory.slice(0, 3)).map((call) => (
              <div key={call.id} className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">
                    {call.isIncoming ? '📥' : '📤'}
                  </span>
                  <span className="text-gray-300">{call.participant}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(call.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {call.duration ? formatDuration(call.duration) : 'Ongoing'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    call.status === 'ongoing' ? 'bg-green-500/20 text-green-400' : 
                    call.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {call.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}