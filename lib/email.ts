import { Resend } from 'resend';

// ============================================
// RESEND CONFIGURATION - NO GMAIL
// ============================================
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

console.log('📧 EMAIL: USING RESEND ONLY');
console.log('📧 API Key:', RESEND_API_KEY ? '✅ SET' : '❌ MISSING');

if (!RESEND_API_KEY) {
  console.error('❌ FATAL: RESEND_API_KEY is missing!');
}

// Initialize Resend
let resend: any = null;
if (RESEND_API_KEY) {
  try {
    resend = new Resend(RESEND_API_KEY);
    console.log('✅ Resend initialized');
  } catch (e: any) {
    console.error('❌ Resend init error:', e.message);
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    if (!resend) {
      console.error('❌ Resend not available');
      return false;
    }

    console.log(`📧 Sending OTP to: ${email}`);
    console.log(`🔑 OTP: ${otp}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px;">
          <div style="background: white; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #667eea;">🔐 VideoStream Pro</h2>
            <p style="color: #333;">Your OTP is:</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 42px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
            </div>
            <p style="color: #666;">Valid for 10 minutes.</p>
          </div>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: '🔐 Your Login OTP - VideoStream Pro',
      html: html,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return false;
    }

    console.log(`✅ OTP sent via Resend (ID: ${result.data?.id})`);
    return true;
  } catch (error: any) {
    console.error('❌ OTP failed:', error.message);
    return false;
  }
}

export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  console.log(`📱 SMS (DEMO): ${otp} to ${phone}`);
  return true;
}

export async function sendInvoiceEmail(
  email: string,
  data: {
    username: string;
    planName: string;
    planType: string;
    paymentId: string;
    amount: number;
    watchTime: string;
    features: string[];
    startDate: string;
    endDate: string;
  }
): Promise<boolean> {
  try {
    if (!resend) {
      console.error('❌ Resend not available');
      return false;
    }

    console.log(`📧 Sending invoice to: ${email}`);
    console.log(`📄 Plan: ${data.planName}, Amount: ₹${data.amount}`);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; }
          .invoice-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .invoice-box td { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎬 VideoStream Pro</h1>
            <p>Payment Confirmation & Invoice</p>
          </div>
          <div class="content">
            <h2>Hello ${data.username},</h2>
            <p>Thank you for upgrading to <strong>${data.planName}</strong>!</p>
            <div class="invoice-box">
              <h3>📄 Invoice Details</h3>
              <table>
                <tr><td>Invoice Number</td><td>#INV-${Date.now().toString().slice(-8)}</td></tr>
                <tr><td>Date</td><td>${new Date().toLocaleDateString()}</td></tr>
                <tr><td>Plan</td><td>${data.planName}</td></tr>
                <tr><td>Amount</td><td>₹${data.amount}</td></tr>
                <tr><td>Payment ID</td><td>${data.paymentId}</td></tr>
                <tr><td>Watch Time</td><td>${data.watchTime}</td></tr>
                <tr><td>Start Date</td><td>${data.startDate}</td></tr>
                <tr><td>Valid Until</td><td>${data.endDate}</td></tr>
              </table>
            </div>
            <div style="margin: 20px 0;">
              <h3>✨ Plan Features</h3>
              <ul>${data.features.map(f => `<li>${f}</li>`).join('')}</ul>
            </div>
            <p>Happy watching!<br><strong>The VideoStream Pro Team</strong></p>
          </div>
          <div class="footer">
            <p>System-generated invoice.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `🎬 ${data.planName} - Payment Confirmation & Invoice`,
      html: html,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return false;
    }

    console.log(`✅ Invoice sent via Resend (ID: ${result.data?.id})`);
    return true;
  } catch (error: any) {
    console.error('❌ Invoice failed:', error.message);
    return false;
  }
}