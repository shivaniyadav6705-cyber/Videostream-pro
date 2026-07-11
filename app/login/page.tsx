'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { setToken, setUser, getToken, syncFromLocalStorage } from '@/lib/auth';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [otpMethod, setOtpMethod] = useState<'email' | 'phone'>('email');
  const [userContact, setUserContact] = useState('');
  const [location, setLocation] = useState<{ city: string; state: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();

 
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
   
    syncFromLocalStorage();
    const token = getToken();
    if (token) {
      router.push('/');
    }
  }, []);

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`New OTP sent to your ${otpMethod}`);
        startResendTimer();
      } else {
        toast.error(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
       
        setToken(data.token);
        setUser(data.user);
        
        if (data.theme) {
          document.documentElement.setAttribute('data-theme', data.theme);
          localStorage.setItem('theme', data.theme);
        }
        toast.success('Registration successful!');
        router.push('/');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: formData.email,
          password: formData.password,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUserId(data.userId);
        setOtpMethod(data.method);
        setUserContact(data.method === 'email' ? formData.email : formData.phone);
        setLocation(data.location);
        setStep('otp');
        startResendTimer();
        toast.success(`OTP sent to your ${data.method}`);
        
        
        if (data.theme) {
          document.documentElement.setAttribute('data-theme', data.theme);
          localStorage.setItem('theme', data.theme);
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
       
        setToken(data.token);
        setUser(data.user);
        
        if (data.theme) {
          document.documentElement.setAttribute('data-theme', data.theme);
          localStorage.setItem('theme', data.theme);
        }
        toast.success('Login successful!');
        router.push('/');
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Verification failed');
    }
    setLoading(false);
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔐</div>
            <h2 className="text-2xl font-bold text-gray-800">Enter Verification Code</h2>
            <p className="text-gray-500 text-sm mt-1">
              We've sent a 6-digit code to your {otpMethod}
            </p>
            {location && (
              <p className="text-xs text-gray-400 mt-2">
                📍 Detected location: {location.city}, {location.state}
              </p>
            )}
            <p className="text-xs text-blue-600 mt-1">
              ✉️ {otpMethod === 'email' ? userContact : userContact?.slice(0, 3) + '****' + userContact?.slice(-4)}
            </p>
          </div>
          
          {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">{error}</div>}
          
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
              maxLength={6}
              autoFocus
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendTimer > 0}
              className="w-full text-gray-500 text-sm hover:underline disabled:opacity-50"
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </button>
            
            <button
              type="button"
              onClick={() => setStep('credentials')}
              className="w-full text-gray-500 text-sm hover:underline"
            >
              ← Back to Login
            </button>
          </form>
          
          <p className="text-center text-xs text-gray-400 mt-6">
            💡 For testing, OTP is logged in terminal
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{isRegister ? '✨' : '🎬'}</div>
          <h2 className="text-2xl font-bold text-gray-800">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-gray-500 text-sm">{isRegister ? 'Join VideoStream Pro today' : 'Login to continue watching'}</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-600 rounded-lg text-sm text-center">{success}</div>}
        
        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Username *"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            required
          />
          
          {isRegister && (
            <input
              type="tel"
              placeholder="Phone Number *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              required
            />
          )}
          
          <input
            type="password"
            placeholder="Password *"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            required
          />
          
          {isRegister && (
            <input
              type="password"
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              required
            />
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isRegister ? 'Register' : 'Send OTP')}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setFormData({ username: '', email: '', phone: '', password: '', confirmPassword: '' });
            }}
            className="text-blue-600 hover:underline text-sm"
          >
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>
        
        <div className="mt-6 p-3 bg-gray-100 rounded-lg">
          <p className="text-xs text-center text-gray-600">
            🔐 <strong>Region-based Security:</strong><br />
            South India → OTP via Email | Other regions → OTP via SMS
          </p>
        </div>
      </div>
    </div>
  );
}