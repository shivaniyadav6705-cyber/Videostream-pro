import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 DEBUG DOWNLOADS API CALLED');

    // Get token from Authorization header
    const authHeader = req.headers.get('authorization');
    console.log('📝 Auth Header:', authHeader);

    const token = authHeader?.split(' ')[1];
    console.log('🔑 Token:', token ? 'Present' : 'Missing');

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No token provided. Please login first.' 
      }, { status: 401 });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('👤 User ID from token:', decoded.userId);
    } catch (jwtError: any) {
      console.error('❌ JWT Error:', jwtError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token. Please login again.' 
      }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId: user._id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      downloadsToday: user.downloadsToday || 0,
      downloadedVideos: user.downloadedVideos || [],
      downloadedVideosCount: user.downloadedVideos?.length || 0,
    });

  } catch (error: any) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}