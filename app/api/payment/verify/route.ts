import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

declare global {
  var _users: any[];
  var _otps: any[];
}
global._users = global._users || [];
global._otps = global._otps || [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, planName } = body;
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keySecret) {
      console.error('❌ RAZORPAY_KEY_SECRET missing');
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
    }

    // Verify signature
    const bodyText = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(bodyText.toString())
      .digest('hex');
    
    console.log('🔐 Signature check:');
    console.log('Expected:', expectedSignature.substring(0, 20) + '...');
    console.log('Received:', razorpay_signature?.substring(0, 20) + '...');
    console.log('Match:', expectedSignature === razorpay_signature);
    
    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Signature mismatch');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }
    
    console.log('✅ Payment verified successfully!');
    
    // Decode token and update user
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const userIndex = global._users.findIndex((u: any) => u.id === decoded.userId);
    
    if (userIndex !== -1) {
      const oldPlan = global._users[userIndex].plan;
      global._users[userIndex].plan = planType;
      global._users[userIndex].lastPaymentId = razorpay_payment_id;
      global._users[userIndex].upgradedAt = new Date().toISOString();
      
      // Reset download limits on upgrade
      global._users[userIndex].downloadsToday = 0;
      global._users[userIndex].lastDownloadDate = new Date().toDateString();
      
      console.log(`✅ User ${global._users[userIndex].username} upgraded from ${oldPlan} to ${planName}`);
      console.log(`💰 Payment ID: ${razorpay_payment_id}`);
      console.log(`📥 Download limit reset for ${planName} plan`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planName}`,
      plan: planType,
      paymentId: razorpay_payment_id,
    });
    
  } catch (error: any) {
    console.error('❌ Verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}