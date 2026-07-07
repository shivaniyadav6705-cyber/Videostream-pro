import { NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email';

export async function GET() {
  // ✅ CHANGE THIS TO YOUR ACTUAL EMAIL ADDRESS
  const testEmail = 'shivaniyadav6705@gmail.com';  // ← YOUR EMAIL HERE
  
  console.log(`📧 Sending test invoice to: ${testEmail}`);
  console.log(`📧 FROM_EMAIL: ${process.env.FROM_EMAIL}`);
  console.log(`📧 RESEND_API_KEY set: ${!!process.env.RESEND_API_KEY}`);
  
  const result = await sendInvoiceEmail(testEmail, {
    username: 'Test User',
    planName: 'Gold Plan (TEST)',
    planType: 'gold',
    paymentId: 'test_pay_123456',
    amount: 100,
    watchTime: 'Unlimited',
    features: [
      'Unlimited watch time',
      '4K Quality',
      '24/7 Support',
      'No Ads',
      'Exclusive Content'
    ],
    startDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  });

  console.log(`📧 Result: ${result ? '✅ Success' : '❌ Failed'}`);

  return NextResponse.json({
    success: result,
    message: result ? '✅ Test invoice email sent successfully' : '❌ Test invoice email failed',
    email: testEmail,
    debug: {
      fromEmail: process.env.FROM_EMAIL,
      resendKeySet: !!process.env.RESEND_API_KEY,
    }
  });
}