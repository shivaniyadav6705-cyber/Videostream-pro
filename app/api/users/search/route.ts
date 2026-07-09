import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Search for users (excluding current user)
    const users = await User.find({
      $and: [
        { _id: { $ne: decoded.userId } },
        {
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email plan avatar')
    .limit(10);

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('❌ User search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}