import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, email, phone, password } = await req.json();

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Create user
    const user = new User({
      username,
      email,
      phone: phone || '',
      password,
      plan: 'free',
      planStartDate: new Date(),
      planEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    console.log(`✅ User registered: ${username} (${email})`);

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
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}