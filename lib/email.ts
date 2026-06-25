import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('📧 Email module loaded');
console.log('📧 EMAIL_USER:', EMAIL_USER ? '✅ Set' : '❌ MISSING');
console.log('📧 EMAIL_PASS:', EMAIL_PASS ? '✅ Set' : '❌ MISSING');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Email error:', error.message);
  } else {
    console.log('✅ Email transporter ready');
  }
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// SEND OTP EMAIL
// ============================================
export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    console.log(`📧 Sending OTP to: ${email}`);
    console.log(`🔑 OTP: ${otp}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px;">
          <div style="background: white; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #667eea;">🔐 VideoStream Pro OTP</h2>
            <p style="color: #333;">Your OTP for login is:</p>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 42px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
            </div>
            <p style="color: #666;">Valid for 10 minutes.</p>
          </div>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Login OTP - VideoStream Pro',
      html,
    });

    console.log(`✅ OTP email sent to ${email} (ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ OTP email failed:', error.message);
    return false;
  }
}

// ============================================
// SEND SMS OTP (Console Demo)
// ============================================
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  console.log('\n' + '='.repeat(50));
  console.log(`📱 SMS OTP (DEMO MODE)`);
  console.log(`📱 To: ${phone}`);
  console.log(`📱 Your OTP is: ${otp}`);
  console.log(`📱 Valid for 10 minutes`);
  console.log('='.repeat(50) + '\n');
  return true;
}

// ============================================
// SEND INVOICE EMAIL
// ============================================
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
    console.log(`📧 Sending invoice to: ${email}`);
    console.log(`📄 Plan: ${data.planName}, Amount: ₹${data.amount}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white;">🎬 VideoStream Pro</h1>
          <p style="color: rgba(255,255,255,0.8);">Payment Confirmation</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2>Hello ${data.username},</h2>
          <p>Thank you for upgrading to <strong>${data.planName}</strong>!</p>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Invoice Number</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">#INV-${Date.now().toString().slice(-8)}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${new Date().toLocaleDateString()}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Plan</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.planName}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Amount</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">₹${data.amount}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Payment ID</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.paymentId}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Watch Time</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.watchTime}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Start Date</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.startDate}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Valid Until</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${data.endDate}</td></tr>
            </table>
          </div>
          <div style="margin: 20px 0;">
            <h3>✨ Plan Features</h3>
            <ul>${data.features.map(f => `<li>${f}</li>`).join('')}</ul>
          </div>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: #667eea; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px;">Go to VideoStream Pro</a>
          </div>
          <p>Happy watching!<br><strong>The VideoStream Pro Team</strong></p>
        </div>
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #eee;">
          <p>System-generated invoice. Do not reply to this email.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${EMAIL_USER}>`,
      to: email,
      subject: `🎬 ${data.planName} - Payment Confirmation & Invoice`,
      html,
    });

    console.log(`✅ Invoice email sent to ${email} (ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Invoice email failed:', error.message);
    return false;
  }
}