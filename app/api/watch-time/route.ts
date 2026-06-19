import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

const LIMITS = { free: 300, bronze: 420, silver: 600, gold: Infinity };

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
    
    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    
    const { duration } = await req.json();
    await connectDB();
    
    const user = await User.findById(decoded.userId);
    const today = new Date().toDateString();
    
    if (user.watchDate !== today) {
      user.watchTimeUsed = 0;
      user.watchDate = today;
    }
    
    user.watchTimeUsed += duration;
    await user.save();
    
    const remaining = LIMITS[user.plan as keyof typeof LIMITS] - user.watchTimeUsed;
    
    return NextResponse.json({ remaining: Math.max(0, remaining), canWatch: remaining > 0 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update watch time' }, { status: 500 });
  }
}