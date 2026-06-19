import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing',
    razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing',
    allKeys: Object.keys(process.env).filter(k => k.includes('RAZOR')),
  });
}