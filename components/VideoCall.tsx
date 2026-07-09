'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  plan: string;
  avatar?: string;
}

interface CallHistory {
  id: number;
  meetingId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  participant: string;
  participantId: string;
  status: 'ongoing' | 'completed' | 'missed';
  isIncoming?: boolean;
}

export default function VideoCall() {
  const [user, setUser] = useState<any>(null);
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
  
  // New states for user search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [callWithUser, setCallWithUser] = useState<User | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user and call history
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    const savedHistory = localStorage.getItem('callHistory');
    if (savedHistory) {
      setCallHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Generate meeting ID
  const generateMeetingId = () => {
    return Math.random().toString(36).substring(2, 10) + 
           Math.random().toString(36).substring(2, 6);
  };

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.users) {
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 500);
  };

  // Call a user
  const callUser = (user: User) => {
    setSelectedUser(user);
    setCallWithUser(user);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    
    // Start the call
    startCall('video', user);
  };

  // Start call with specific user
  const startCall = (type: 'audio' | 'video', targetUser?: User) => {
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
    const participantName = targetUser ? targetUser.username : 'Unknown User';
    const participantId = targetUser ? targetUser._id : 'unknown';
    
    const callRecord: CallHistory = {
      id: Date.now(),
      meetingId: newMeetingId,
      startTime: new Date().toISOString(),
      participant: participantName,
      participantId: participantId,
      status: 'ongoing'
    };
    const updatedHistory = [callRecord, ...callHistory];
    setCallHistory(updatedHistory);
    localStorage.setItem('callHistory', JSON.stringify(updatedHistory));
    
    const message = targetUser 
      ? `📞 Calling ${targetUser.username}...` 
      : `✅ ${type === 'audio' ? 'Audio' : 'Video'} call started!`;
    toast.success(message);
  };

  // Join existing meeting
  const joinCall = () => {
    if (!meetingId) {
      toast.error('Please enter a Meeting ID');
      return;
    }
    
    const link = `https://meet.google.com/${meetingId}`;
    setMeetingLink(link);
    setIsCallActive(true);
    
    window.open(link, '_blank');
    
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setCallDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    toast.success('✅ Joining meeting...');
  };

  // Screen Sharing
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: 'always' } as MediaTrackConstraints,
        audio: true 
      });
      
      setIsScreenSharing(true);
      const screenTrack = stream.getVideoTracks()[0];
      
      toast.success('🖥️ Screen sharing started!');
      
      screenTrack.onended = () => {
        setIsScreenSharing(false);
        toast.success('Screen sharing stopped');
      };
      
    } catch (err) {
      console.error('Screen share error:', err);
      toast.error('Screen sharing cancelled');
      setIsScreenSharing(false);
    }
  };

  // Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: 'always' } as MediaTrackConstraints,
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
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
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
      toast.success('⏺️ Recording started...');
      
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Recording failed');
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
    setCallWithUser(null);
    setSelectedUser(null);
    
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
      toast.success('📋 Link copied to clipboard!');
    }
  };

  // If call is active
  if (isCallActive) {
    return (
      <div className="space-y-4">
        {/* Call Controls */}
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {callType === 'audio' ? '🎙️ Audio Call' : '📹 Video Call'}
                {callWithUser && (
                  <span className="text-sm text-blue-400 ml-2">
                    with {callWithUser.username}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-400">
                Meeting ID: <span className="font-mono text-blue-400">{meetingId}</span>
              </p>
              <p className="text-xs text-gray-500">
                ⏱️ Duration: {formatDuration(callDuration)}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
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
        
        {/* Feature Guide */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-center">
          <p className="text-blue-300">
            💡 <strong>YouTube Screen Sharing:</strong> Click "Share Screen" → Select the YouTube tab → Watch together!
          </p>
        </div>
      </div>
    );
  }

  // Main Call Interface
  return (
    <div className="space-y-6">
      {/* Main Call Interface */}
      <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700">
        <div className="text-6xl mb-4">📹</div>
        <h2 className="text-2xl font-bold text-white mb-2">Video Call</h2>
        <p className="text-gray-400 mb-6">Connect with friends using Google Meet</p>
        
        {/* User Search Section */}
        <div className="mb-6">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg text-white transition flex items-center gap-2 mx-auto"
          >
            {showSearch ? '🔍 Hide Search' : '🔍 Find a User'}
          </button>
          
          {showSearch && (
            <div className="mt-4 max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isSearching && (
                  <span className="absolute right-3 top-3 text-gray-400">⏳</span>
                )}
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-slate-700 rounded-lg overflow-hidden">
                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-600 transition cursor-pointer border-b border-slate-600 last:border-b-0"
                      onClick={() => callUser(result)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                          {result.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left">
                          <p className="text-white font-medium">{result.username}</p>
                          <p className="text-xs text-gray-400">{result.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          callUser(result);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-white text-sm transition"
                      >
                        📞 Call
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                <p className="mt-2 text-gray-400 text-sm">No users found</p>
              )}
            </div>
          )}
        </div>
        
        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-600"></div>
          <span className="text-gray-400 text-sm">OR</span>
          <div className="flex-1 h-px bg-slate-600"></div>
        </div>
        
        {/* Call Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => startCall('video')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 justify-center"
          >
            🎥 Start Video Call
          </button>
          
          <button
            onClick={() => startCall('audio')}
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 justify-center"
          >
            🎙️ Start Audio Call
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
          <p>✨ Features: Video/Audio calls | Screen sharing (YouTube) | Call recording | Find users</p>
          <p className="text-xs text-gray-500 mt-2">
            💡 Search for a user and call them directly, or create a meeting and share the link.
          </p>
        </div>
      </div>
      
      {/* Call History */}
      {callHistory.length > 0 && (
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
      )}
    </div>
  );
}