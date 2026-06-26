import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendInvoiceEmail } from '@/lib/email';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const PLAN_DETAILS: Record<string, any> = {
  bronze: { name: 'Bronze Plan', watchTime: '7 minutes/day', price: 10, features: ['7 min daily', 'SD Quality', 'Basic Support'] },
  silver: { name: 'Silver Plan', watchTime: '10 minutes/day', price: 50, features: ['10 min daily', 'HD Quality', 'Priority Support', 'No Ads'] },
  gold: { name: 'Gold Plan', watchTime: 'Unlimited', price: 100, features: ['Unlimited', '4K Quality', '24/7 Support', 'No Ads', 'Exclusive'] },
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planType, planName } = await req.json();

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(text).digest('hex');

    if (signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

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
    user.upgradedAt = now;
    await user.save();

    console.log(`✅ ${user.username} upgraded to ${planName}`);

    const planInfo = PLAN_DETAILS[planType];
    await sendInvoiceEmail(user.email, {
      username: user.username,
      planName: planInfo.name,
      planType: planType,
      paymentId: razorpay_payment_id,
      amount: planInfo.price,
      watchTime: planInfo.watchTime,
      features: planInfo.features,
      startDate: now.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
    });

    return NextResponse.json({ success: true, message: `Upgraded to ${planName}`, plan: planType });
  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}