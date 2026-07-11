import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { sendInvoiceEmail } from '@/lib/email';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const PLAN_DETAILS: Record<string, any> = {
  bronze: {
    name: 'Bronze Plan',
    watchTime: '7 minutes per day',
    price: 10,
    features: ['7 minutes daily watch time', 'SD Quality (480p)', 'Basic Support', '1 Device at a time'],
  },
  silver: {
    name: 'Silver Plan',
    watchTime: '10 minutes per day',
    price: 50,
    features: ['10 minutes daily watch time', 'HD Quality (720p)', 'Priority Support', '2 Devices', 'No Ads'],
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

    console.log('\n' + '='.repeat(50));
    console.log('💰 PAYMENT VERIFICATION STARTED');
    console.log(`📦 Order ID: ${razorpay_order_id}`);
    console.log(`💳 Payment ID: ${razorpay_payment_id}`);
    console.log(`📋 Plan Type: ${planType}`);
    console.log(`📋 Plan Name: ${planName}`);
    console.log('='.repeat(50) + '\n');

   
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log(`👤 User ID: ${decoded.userId}`);

 
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    console.log(`🔐 Signature match: ${signature === razorpay_signature}`);

    if (signature !== razorpay_signature) {
      console.log('❌ Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`👤 User: ${user.username} (${user.email})`);
    console.log(`📋 Previous Plan: ${user.plan}`);

   
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

    console.log(`✅ User upgraded to: ${planName}`);

    
    const planInfo = PLAN_DETAILS[planType];
    let emailSent = false;

    if (planInfo) {
      console.log(`📧 Attempting to send invoice to: ${user.email}`);
      
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
          console.log(`❌ Invoice email failed to send to ${user.email}`);
        }
      } catch (emailError: any) {
        console.error('❌ Email error:', emailError.message);
        emailSent = false;
      }
    } else {
      console.log(`❌ Plan info not found for: ${planType}`);
    }

    console.log('='.repeat(50));
    console.log(`✅ Payment Verification Complete`);
    console.log(`📧 Invoice Email Sent: ${emailSent}`);
    console.log(`📧 To: ${user.email}`);
    console.log('='.repeat(50) + '\n');

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planName}`,
      plan: planType,
      startDate: now,
      endDate: endDate,
      invoiceSent: emailSent,
    });
  } catch (error: any) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}