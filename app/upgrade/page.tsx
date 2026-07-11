'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken, getUser, setUser } from '@/lib/auth';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UpgradePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

 
  useEffect(() => {
    const token = getToken();
    const savedUser = getUser();
    if (!token || !savedUser) {
      router.push('/login');
    } else {
      setUser(savedUser);
    }

    if (!document.querySelector('#razorpay-script')) {
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => console.log('✅ Razorpay loaded');
      script.onerror = () => console.error('❌ Razorpay failed to load');
      document.body.appendChild(script);
    }
  }, []);

  const plans = [
    { id: 'bronze', name: 'Bronze', price: 10, watchTime: '7 min/day', color: '#cd7f32', features: ['7 minutes daily', 'SD Quality', 'Basic Support'] },
    { id: 'silver', name: 'Silver', price: 50, watchTime: '10 min/day', color: '#94a3b8', features: ['10 minutes daily', 'HD Quality', 'Priority Support', 'No Ads'] },
    { id: 'gold', name: 'Gold', price: 100, watchTime: 'Unlimited', color: '#f59e0b', features: ['Unlimited', '4K Quality', '24/7 Support', 'No Ads', 'Exclusive Content'] }
  ];

  const handleUpgrade = async (plan: typeof plans[0]) => {
    setLoading(true);
    setMessage('');
    
   
    const token = getToken();
    
    if (!token) {
      setMessage('Please login again');
      router.push('/login');
      return;
    }
    
    try {
      console.log('📞 Creating order for:', plan.name);
      
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          planType: plan.id, 
          amount: plan.price, 
          planName: plan.name 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      console.log('✅ Order created:', data);

      if (!window.Razorpay) {
        await new Promise((resolve) => {
          const checkInterval = setInterval(() => {
            if (window.Razorpay) {
              clearInterval(checkInterval);
              resolve(true);
            }
          }, 100);
        });
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'VideoStream Pro',
        description: `${plan.name} Plan - ₹${plan.price}`,
        order_id: data.orderId,
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: { color: '#3b82f6' },
        handler: async (paymentResponse: any) => {
          console.log('💰 Payment response:', paymentResponse);
          setMessage('Verifying payment...');
          
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                planType: plan.id,
                planName: plan.name
              })
            });
            
            const verifyData = await verifyRes.json();
            
            if (verifyRes.ok && verifyData.success) {
              const updatedUser = { ...user, plan: plan.id };
              
              setUser(updatedUser);
              setUser(updatedUser);
              setMessage(`✅ Successfully upgraded to ${plan.name} Plan!`);
              setTimeout(() => router.push('/'), 2000);
            } else {
              setMessage('Payment verification failed');
            }
          } catch (err) {
            console.error('Verification error:', err);
            setMessage('Payment verification failed');
          }
          setLoading(false);
        },
        modal: {
          ondismiss: () => {
            setMessage('Payment cancelled');
            setLoading(false);
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setMessage(err.message || 'Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const handleLogout = () => {
   
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <nav className="bg-slate-900/80 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <Link href="/" className="text-xl font-bold text-white">🎬 VideoStream Pro</Link>
          <div className="flex gap-6">
            <Link href="/watch" className="text-gray-300 hover:text-white">Watch</Link>
            <Link href="/video-call" className="text-gray-300 hover:text-white">Video Call</Link>
            <Link href="/upgrade" className="text-white">Upgrade</Link>
            <Link href="/profile" className="text-gray-300 hover:text-white">Profile</Link>
          </div>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white">Logout</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Choose Your Plan</h1>
          <p className="text-gray-400">Current: <span className="font-bold text-blue-400">{user.plan?.toUpperCase() || 'FREE'}</span></p>
          {message && (
            <div className={`mt-4 p-3 rounded-lg ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-slate-800/50 rounded-2xl overflow-hidden border-t-4 transition hover:scale-105" style={{ borderTopColor: plan.color }}>
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold" style={{ color: plan.color }}>{plan.name}</h2>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <div className="bg-slate-700/50 rounded-full py-1 px-3 inline-block text-sm mb-4">⏱️ {plan.watchTime}</div>
              </div>
              <div className="px-6 pb-6">
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, i) => <li key={i} className="text-sm text-gray-300">✓ {f}</li>)}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading || user.plan === plan.id}
                  className="w-full py-3 rounded-lg font-semibold transition hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: user.plan === plan.id ? '#475569' : plan.color, color: '#fff' }}
                >
                  {user.plan === plan.id ? '✓ Current Plan' : `Upgrade - ₹${plan.price}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>💳 <strong>Test NetBanking:</strong> Test any NetBanking option to test</p>
          <p className="text-xs mt-1">🔐 Razorpay Test Mode - No actual money deducted</p>
        </div>
      </main>
    </div>
  );
}