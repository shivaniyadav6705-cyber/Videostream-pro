import nodemailer from 'nodemailer';

// Get email credentials
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('📧 Email module loaded');
console.log('📧 EMAIL_USER:', EMAIL_USER ? '✅ Set' : '❌ MISSING');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify on startup
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email error:', error.message);
  } else {
    console.log('✅ Email transporter ready');
  }
});

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// SEND OTP EMAIL - FOR LOGIN
// ============================================
export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    console.log(`📧 Sending OTP to: ${email}`);
    console.log(`🔑 OTP: ${otp}`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #f4f4f4;">
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
// SEND SMS OTP - FOR OTHER REGIONS
// ============================================
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  console.log('\n' + '='.repeat(50));
  console.log(`📱 SMS OTP (DEMO MODE)`);
  console.log(`📱 To: ${phone}`);
  console.log(`📱 Your OTP is: ${otp}`);
  console.log('='.repeat(50) + '\n');
  return true;
}

// ============================================
// SEND INVOICE EMAIL - FOR PLAN UPGRADE
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
            <table style="width: 100%;">
              <tr><td><strong>Plan</strong></td><td style="text-align: right;">${data.planName}</td></tr>
              <tr><td><strong>Amount</strong></td><td style="text-align: right;">₹${data.amount}</td></tr>
              <tr><td><strong>Payment ID</strong></td><td style="text-align: right;">${data.paymentId}</td></tr>
              <tr><td><strong>Valid Until</strong></td><td style="text-align: right;">${data.endDate}</td></tr>
            </table>
          </div>
          <div style="margin: 20px 0;">
            <h3>✨ Features</h3>
            <ul>${data.features.map(f => `<li>${f}</li>`).join('')}</ul>
          </div>
          <p>Happy watching!<br><strong>The VideoStream Pro Team</strong></p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"VideoStream Pro" <${EMAIL_USER}>`,
      to: email,
      subject: `🎬 ${data.planName} - Payment Confirmation`,
      html,
    });

    console.log(`✅ Invoice email sent to ${email} (ID: ${info.messageId})`);
    return true;
  } catch (error: any) {
    console.error('❌ Invoice email failed:', error.message);
    return false;
  }
}