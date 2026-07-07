import { NextResponse } from 'next/server';
import { sendInvoiceEmail } from '@/lib/email';

export async function GET() {
  // ✅ CHANGE THIS TO YOUR ACTUAL EMAIL
  const testEmail = 'shivaniyadav6705@gmail.com';  // ← CHANGE THIS
  
  console.log(`📧 Sending test invoice to: ${testEmail}`);
  
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

  return NextResponse.json({
    success: result,
    message: result ? '✅ Test invoice email sent successfully' : '❌ Test invoice email failed',
    email: testEmail,
  });
}