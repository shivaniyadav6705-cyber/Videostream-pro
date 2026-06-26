import nodemailer from 'nodemailer';
import twilio from 'twilio';

// ============================================
// EMAIL CONFIGURATION
// ============================================
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('📧 Email module loaded');
console.log('📧 EMAIL_USER:', EMAIL_USER ? '✅ Set' : '❌ MISSING');

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
console.log('📱 TWILIO_PHONE_NUMBER:', TWILIO_PHONE_NUMBER ? '✅ Set' : '❌ MISSING');

// Initialize Twilio client
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

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
    console.log(`📧 Sending OTP to: ${email}`);

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
// SEND OTP VIA SMS USING TWILIO (REAL SMS)
// ============================================
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  try {
    console.log(`📱 Sending SMS OTP to: ${phone}`);

    // Check if Twilio is configured
    if (!twilioClient || !TWILIO_PHONE_NUMBER) {
      console.log('⚠️ Twilio not configured. Using demo mode.');
      console.log(`📱 SMS OTP (DEMO): ${otp} to ${phone}`);
      return true;
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = phone.trim();
    
    // Remove any spaces
    formattedPhone = formattedPhone.replace(/\s/g, '');
    
    // If no country code, add +91 for India
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('91')) {
        formattedPhone = `+${formattedPhone}`;
      } else {
        formattedPhone = `+91${formattedPhone}`;
      }
    }

    console.log(`📱 Formatted phone: ${formattedPhone}`);

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body: `🔐 Your VideoStream Pro OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      to: formattedPhone,
      from: TWILIO_PHONE_NUMBER,
    });

    console.log(`✅ SMS sent successfully! SID: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('❌ SMS send failed:', error.message);
    
    // Fallback to console demo mode
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
            <p><strong>Plan:</strong> ${data.planName}</p>
            <p><strong>Amount:</strong> ₹${data.amount}</p>
            <p><strong>Payment ID:</strong> ${data.paymentId}</p>
            <p><strong>Valid Until:</strong> ${data.endDate}</p>
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