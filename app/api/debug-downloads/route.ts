import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 DEBUG DOWNLOADS API CALLED');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId: user._id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      downloadsToday: user.downloadsToday,
      lastDownloadDate: user.lastDownloadDate,
      downloadedVideos: user.downloadedVideos || [],
      downloadedVideosCount: user.downloadedVideos?.length || 0,
      allUserData: {
        downloadedVideos: user.downloadedVideos,
        downloadsToday: user.downloadsToday,
        plan: user.plan,
        username: user.username,
        email: user.email,
      }
    });

  } catch (error: any) {
    console.error('❌ Debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}