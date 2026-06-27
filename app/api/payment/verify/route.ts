import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendInvoiceEmail } from '@/lib/email';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const PLAN_DETAILS: Record<string, any> = {
  bronze: {
    name: 'Bronze Plan',
    watchTime: '7 minutes/day',
    price: 10,
    features: ['7 min daily watch time', 'SD Quality (480p)', 'Basic Support', '1 Device at a time'],
  },
  silver: {
    name: 'Silver Plan',
    watchTime: '10 minutes/day',
    price: 50,
    features: ['10 min daily watch time', 'HD Quality (720p)', 'Priority Support', '2 Devices', 'No Ads'],
  },
  gold: {
    name: 'Gold Plan',
    watchTime: 'Unlimited',
    price: 100,
    features: ['Unlimited watch time', '4K Quality', '24/7 Support', '4 Devices', 'No Ads', 'Exclusive Content'],
  },
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, planName } = body;

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verify signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Find and update user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    user.plan = planType;
    user.planStartDate = now;
    user.planEndDate = endDate;
    user.lastPaymentId = razorpay_payment_id;
    user.planOrderId = razorpay_order_id;
    user.upgradedAt = now;
    user.downloadsToday = 0;
    await user.save();

    console.log(`✅ User upgraded: ${user.username} → ${planName}`);
    console.log(`📧 Sending invoice to: ${user.email}`);

    // ============================================
    // SEND INVOICE EMAIL
    // ============================================
    const planInfo = PLAN_DETAILS[planType];
    let emailSent = false;

    if (planInfo) {
      try {
        emailSent = await sendInvoiceEmail(user.email, {
          username: user.username,
          planName: planInfo.name,
          planType: planType,
          paymentId: razorpay_payment_id,
          amount: planInfo.price,
          watchTime: planInfo.watchTime,
          features: planInfo.features,
          startDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          endDate: endDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        });

        if (emailSent) {
          console.log(`✅ Invoice email sent to ${user.email}`);
        } else {
          console.error(`❌ Failed to send invoice email to ${user.email}`);
        }
      } catch (emailError: any) {
        console.error('❌ Email error:', emailError.message);
        emailSent = false;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planName}`,
      plan: planType,
      startDate: now,
      endDate: endDate,
      invoiceSent: emailSent,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}