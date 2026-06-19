import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🔵 CREATE-ORDER API CALLED');
  
  try {
    const body = await req.json();
    const { planType, amount, planName } = body;
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Get keys from environment
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    console.log('📝 Environment check:');
    console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID:', keyId ? `✅ ${keyId.substring(0, 15)}...` : '❌ MISSING');
    console.log('RAZORPAY_KEY_SECRET:', keySecret ? `✅ ${keySecret.substring(0, 15)}...` : '❌ MISSING');
    
    // Validate keys
    if (!keyId || !keySecret) {
      console.error('❌ Razorpay keys missing');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Import Razorpay
    const Razorpay = require('razorpay');
    
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    console.log('💰 Creating order for:', { planType, amount, planName });

    // Create order - amount in paise (₹10 = 1000 paise)
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { planType, planName },
    });

    console.log('✅ Order created:', order.id);
    console.log('💰 Amount:', order.amount / 100, order.currency);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keyId,
    });
    
  } catch (error: any) {
    console.error('❌ Order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}