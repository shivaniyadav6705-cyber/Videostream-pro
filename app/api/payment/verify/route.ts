import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendInvoiceEmail } from '@/lib/email';

declare global {
  var _users: any[];
  var _otps: any[];
}
global._users = global._users || [];
global._otps = global._otps || [];

// Plan details for invoice
const PLAN_DETAILS: Record<string, { name: string; watchTime: string; features: string[]; price: number }> = {
  bronze: {
    name: 'Bronze Plan',
    watchTime: '7 minutes per day',
    price: 10,
    features: ['7 minutes daily watch time', 'SD Quality (480p)', 'Basic Support', '1 Device at a time']
  },
  silver: {
    name: 'Silver Plan',
    watchTime: '10 minutes per day',
    price: 50,
    features: ['10 minutes daily watch time', 'HD Quality (720p)', 'Priority Support', '2 Devices at a time', 'No Ads']
  },
  gold: {
    name: 'Gold Plan',
    watchTime: 'Unlimited',
    price: 100,
    features: ['Unlimited watch time', '4K Quality', '24/7 Support', '4 Devices at a time', 'No Ads', 'Exclusive Content']
  }
};

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
      const user = global._users[userIndex];
      const oldPlan = user.plan;
      
      // Update user plan
      user.plan = planType;
      user.lastPaymentId = razorpay_payment_id;
      user.upgradedAt = new Date().toISOString();
      user.planOrderId = razorpay_order_id;
      
      // Reset download limits on upgrade
      user.downloadsToday = 0;
      user.lastDownloadDate = new Date().toDateString();
      
      console.log(`✅ User ${user.username} upgraded from ${oldPlan} to ${planName}`);
      console.log(`💰 Payment ID: ${razorpay_payment_id}`);
      console.log(`📥 Download limit reset for ${planName} plan`);
      
      // ============================================
      // SEND INVOICE EMAIL
      // ============================================
      const planInfo = PLAN_DETAILS[planType];
      
      if (planInfo) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30); // 30 days validity
        
        const emailSent = await sendInvoiceEmail(user.email, {
          username: user.username,
          planName: planInfo.name,
          planPrice: planInfo.price,
          planType: planType,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: planInfo.price,
          watchTime: planInfo.watchTime,
          features: planInfo.features,
          validUntil: validUntil.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        });
        
        if (emailSent) {
          console.log(`📧 Invoice email sent to ${user.email}`);
        } else {
          console.error(`❌ Failed to send invoice email to ${user.email}`);
        }
      } else {
        console.error(`❌ Plan details not found for: ${planType}`);
      }
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