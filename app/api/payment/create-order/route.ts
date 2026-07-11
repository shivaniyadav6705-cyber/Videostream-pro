import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import jwt from 'jsonwebtoken';


const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { planType, amount, planName } = await req.json();
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log(`💰 Creating order for user: ${decoded.userId}`);

    const order = await razorpay.orders.create({
      amount: amount * 100, 
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: decoded.userId,
        planType,
        planName,
      },
    });

    console.log(`✅ Order created: ${order.id}`);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}