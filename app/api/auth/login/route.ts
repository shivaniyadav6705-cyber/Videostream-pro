import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json({ error: 'Email/Phone and password required' }, { status: 400 });
    }

    // Find user
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      console.log(`❌ User not found: ${emailOrPhone}`);
      return NextResponse.json({ error: 'User not found. Please register first.' }, { status: 401 });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`❌ Invalid password for: ${emailOrPhone}`);
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${user.username} (${user.email})`);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
        planStartDate: user.planStartDate,
        planEndDate: user.planEndDate,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}