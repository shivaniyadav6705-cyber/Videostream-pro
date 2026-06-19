import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Twilio configuration
const twilioClient = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Email
export async function sendEmailOTP(email: string, otp: string): Promise<boolean> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; padding: 30px;">
          <div style="background: white; border-radius: 10px; padding: 30px; text-align: center;">
            <h2 style="color: #667eea;">🔐 VideoStream Pro</h2>
            <p>Your OTP for login is:</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #667eea;">${otp}</span>
            </div>
            <p>Valid for 10 minutes.</p>
          </div>
        </div>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"VideoStream Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login OTP - VideoStream Pro',
      html,
    });
    console.log(`✅ Email OTP sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

// Send OTP via SMS using Twilio (REAL SMS)
export async function sendSMSOTP(phone: string, otp: string): Promise<boolean> {
  try {
    // Format phone number (ensure it has country code)
    let formattedPhone = phone;
    if (!phone.startsWith('+')) {
      // Add +91 for India if not present
      formattedPhone = phone.startsWith('91') ? `+${phone}` : `+91${phone}`;
    }
    
    const message = await twilioClient.messages.create({
      body: `🔐 Your VideoStream Pro OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
      to: formattedPhone,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
    });
    
    console.log(`✅ SMS OTP sent to ${formattedPhone}: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error('❌ SMS send failed:', error.message);
    return false;
  }
}