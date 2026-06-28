import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

declare global {
  var _users: any[];
}
global._users = global._users || [];

export async function POST(req: NextRequest) {
  try {
    console.log('📥 Download API called');

    // Get token from header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    console.log('🔑 Token present:', !!token);

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
      console.log('👤 User ID:', decoded.userId);
    } catch (jwtError: any) {
      console.error('❌ JWT Error:', jwtError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token. Please login again.' 
      }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('📦 Request body:', body);
    } catch (parseError: any) {
      console.error('❌ Parse error:', parseError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request body' 
      }, { status: 400 });
    }

    const { videoId, videoTitle, videoDuration, videoThumbnail } = body;

    if (!videoTitle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Video title is required' 
      }, { status: 400 });
    }

    // Connect to database
    await connectDB();

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log(`👤 User: ${user.username} (${user.email})`);
    console.log(`📋 Plan: ${user.plan}`);

    // Check download limit for free users
    const today = new Date().toDateString();
    if (user.lastDownloadDate !== today) {
      user.downloadsToday = 0;
      user.lastDownloadDate = today;
    }

    const planLimits: Record<string, number> = {
      free: 1,
      bronze: Infinity,
      silver: Infinity,
      gold: Infinity,
    };

    const limit = planLimits[user.plan] || 1;

    if (user.downloadsToday >= limit) {
      return NextResponse.json({ 
        success: false, 
        error: `Daily download limit reached (${limit}/day). ${user.plan === 'free' ? 'Upgrade to premium for unlimited downloads!' : ''}` 
      }, { status: 403 });
    }

    // Create download record
    const downloadRecord = {
      id: Date.now(),
      videoId: videoId || 'unknown',
      videoTitle,
      videoDuration: videoDuration || '00:00',
      videoThumbnail: videoThumbnail || '🎬',
      downloadedAt: new Date().toISOString(),
    };

    // Add to user's downloads
    if (!user.downloadedVideos) {
      user.downloadedVideos = [];
    }
    user.downloadedVideos.unshift(downloadRecord);
    user.downloadsToday += 1;

    await user.save();

    console.log(`✅ Download recorded: ${videoTitle}`);
    console.log(`📊 Downloads today: ${user.downloadsToday}/${limit === Infinity ? '∞' : limit}`);

    // Return success with download info
    return NextResponse.json({
      success: true,
      message: 'Download started!',
      download: downloadRecord,
      downloadsLeft: limit === Infinity ? 'Unlimited' : limit - user.downloadsToday,
      plan: user.plan,
    });

  } catch (error: any) {
    console.error('❌ Download error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Download failed' 
    }, { status: 500 });
  }
}

// GET endpoint to fetch user's downloads
export async function GET(req: NextRequest) {
  try {
    console.log('📥 GET Downloads API called');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No token provided' 
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (jwtError: any) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
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
      downloads: user.downloadedVideos || [],
      downloadsToday: user.downloadsToday || 0,
      plan: user.plan,
    });

  } catch (error: any) {
    console.error('❌ GET Downloads error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}