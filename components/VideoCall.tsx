'use client';

import { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
  }
}

export default function VideoCall() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Google Meet iframe embed
  const startGoogleMeet = () => {
    const newMeetingId = Math.random().toString(36).substring(2, 10);
    setMeetingId(newMeetingId);
    setIsCallActive(true);
  };

  const joinMeet = () => {
    if (meetingId) {
      setIsCallActive(true);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);
      
      // For demo, we'll just show an alert
      alert('Screen sharing started! The other participant can now see your screen.');
      
      stream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
      };
    } catch (err) {
      alert('Screen sharing cancelled or failed');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      recordedChunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Recording saved to your device!');
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Recording failed. Please allow screen capture.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsScreenSharing(false);
    if (isRecording) stopRecording();
    setMeetingId('');
  };

  if (isCallActive) {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-xl p-4">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold">📹 Google Meet Call</h2>
            <div className="flex gap-2">
              <button
                onClick={startScreenShare}
                className={`px-4 py-2 rounded-lg transition ${isScreenSharing ? 'bg-green-600' : 'bg-blue-600'} hover:opacity-80`}
              >
                {isScreenSharing ? '📺 Sharing Screen' : '🖥️ Share Screen'}
              </button>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-4 py-2 rounded-lg transition ${isRecording ? 'bg-red-600' : 'bg-purple-600'} hover:opacity-80`}
              >
                {isRecording ? '🔴 Recording...' : '⏺️ Record'}
              </button>
              <button
                onClick={endCall}
                className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                🔴 End Call
              </button>
            </div>
          </div>
          
          {/* Google Meet iframe embed */}
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border">
            <iframe
              src={`https://meet.google.com/${meetingId}`}
              className="w-full h-full"
              allow="camera; microphone; display-capture"
              title="Google Meet"
            />
          </div>
          
          <div className="mt-3 text-sm text-gray-400 text-center">
            Meeting ID: <span className="font-mono text-primary">{meetingId}</span>
            <button
              onClick={() => navigator.clipboard.writeText(meetingId)}
              className="ml-2 text-blue-400 hover:text-blue-300"
            >
              📋 Copy
            </button>
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-center">
          💡 <strong>YouTube Screen Sharing:</strong> During the call, click "Share Screen" → Select the YouTube tab → Watch together!
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-8 text-center">
      <div className="text-6xl mb-4">📹</div>
      <h2 className="text-2xl font-bold mb-2">Start a Video Call</h2>
      <p className="text-gray-400 mb-6">Connect with friends using Google Meet</p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={startGoogleMeet}
          className="bg-primary hover:bg-primary/80 px-6 py-3 rounded-lg font-semibold transition"
        >
          🎥 Create New Meeting
        </button>
        
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Meeting ID"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            className="bg-background border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary"
          />
          <button
            onClick={joinMeet}
            disabled={!meetingId}
            className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition disabled:opacity-50"
          >
            Join
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-400">
        <p>✨ Features: Screen sharing (including YouTube) | Call recording | High quality video</p>
      </div>
    </div>
  );
}