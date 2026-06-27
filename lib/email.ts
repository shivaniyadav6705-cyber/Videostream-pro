import nodemailer from 'nodemailer';
import twilio from 'twilio';

// ============================================
// EMAIL CONFIGURATION
// ============================================
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

// ============================================
// TWILIO SMS CONFIGURATION
// ============================================
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

console.log('📱 Twilio loaded');
console.log('📱 TWILIO_ACCOUNT_SID:', TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ MISSING');
console.log('📱 TWILIO_AUTH_TOKEN:', TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ MISSING');
console.log('📱 TWILIO_PHONE_NUMBER:', TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ MISSING');

// Initialize Twilio client
let twilioClient: any = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized');
  } catch (error: any) {
    console.error('❌ Twilio init error:', error.message);
  }
}

// ============================================
// GENERATE OTP
// ============================================
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================
// SEND OTP VIA EMAIL
// ============================================
export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    console.log(`📧 Sending OTP to email: ${email}`);
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
// SEND OTP VIA SMS (TWILIO)
// ============================================
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  try {
    console.log(`📱 Sending SMS OTP to: ${phone}`);
    console.log(`🔑 OTP: ${otp}`);

    if (!twilioClient || !TWILIO_PHONE_NUMBER) {
      console.log('⚠️ Twilio not configured. Using demo mode.');
      console.log(`📱 SMS OTP (DEMO): ${otp} to ${phone}`);
      return true;
    }

    let formattedPhone = phone.trim().replace(/\s/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('91')) {
        formattedPhone = `+${formattedPhone}`;
      } else {
        formattedPhone = `+91${formattedPhone}`;
      }
    }

    console.log(`📱 Formatted phone: ${formattedPhone}`);

    const message = await twilioClient.messages.create({
      body: `🔐 Your VideoStream Pro OTP is: ${otp}. Valid for 10 minutes.`,
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log(`✅ SMS sent! SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('❌ SMS send failed:', error.message);
    console.log(`📱 SMS OTP (FALLBACK): ${otp} to ${phone}`);
    return true;
  }
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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Confirmation - VideoStream Pro</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; }
          .content { padding: 30px; }
          .invoice-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .invoice-box table { width: 100%; border-collapse: collapse; }
          .invoice-box td { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
          .invoice-box td:last-child { text-align: right; font-weight: bold; }
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
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="background: #667eea; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px;">Go to VideoStream Pro</a>
            </div>
            <p>Happy watching!<br><strong>The VideoStream Pro Team</strong></p>
          </div>
          <div class="footer">
            <p>System-generated invoice. Do not reply.</p>
          </div>
        </div>
      </body>
      </html>
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