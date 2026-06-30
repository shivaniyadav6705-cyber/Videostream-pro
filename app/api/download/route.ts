import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// ============================================
// GET - Fetch all downloads
// ============================================
export async function GET(req: NextRequest) {
  try {
    console.log('📥 GET Downloads API STARTED');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No token provided' 
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log(`👤 User: ${user.username}`);
    console.log(`📥 Downloads in DB: ${user.downloadedVideos?.length || 0}`);

    return NextResponse.json({
      success: true,
      downloads: user.downloadedVideos || [],
      downloadsToday: user.downloadsToday || 0,
      plan: user.plan || 'free',
    });

  } catch (error: any) {
    console.error('❌ GET Downloads error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// ============================================
// POST - Save a new download - FIXED
// ============================================
export async function POST(req: NextRequest) {
  try {
    console.log('📥 POST Download API STARTED');

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    console.log('🔑 Token received:', token ? 'Yes' : 'No');

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'No token provided' 
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('👤 Decoded user ID:', decoded.userId);
    } catch (jwtError: any) {
      console.error('❌ JWT Error:', jwtError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid token' 
      }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, videoTitle, videoDuration, videoThumbnail } = body;

    console.log('📦 Download request:', { videoId, videoTitle, videoDuration });

    if (!videoTitle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Video title is required' 
      }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      console.error('❌ User not found:', decoded.userId);
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    console.log(`👤 User found: ${user.username}`);
    console.log(`📋 Current plan: ${user.plan}`);
    console.log(`📥 Existing downloads: ${user.downloadedVideos?.length || 0}`);

    // Check daily limit
    const today = new Date().toDateString();
    console.log(`📅 Today: ${today}`);
    console.log(`📅 Last download date: ${user.lastDownloadDate}`);

    if (user.lastDownloadDate !== today) {
      console.log('🔄 Resetting daily download count');
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
    console.log(`📊 Daily limit: ${limit === Infinity ? 'Unlimited' : limit}`);
    console.log(`📊 Downloads today: ${user.downloadsToday}`);

    if (user.downloadsToday >= limit) {
      console.log(`❌ Daily limit reached`);
      return NextResponse.json({ 
        success: false, 
        error: `Daily limit reached (${limit}/day)` 
      }, { status: 403 });
    }

    // Create download record
    const downloadRecord = {
      id: Date.now(),
      videoId: videoId || 'unknown',
      videoTitle: videoTitle,
      videoDuration: videoDuration || '00:00',
      videoThumbnail: videoThumbnail || '🎬',
      downloadedAt: new Date().toISOString(),
    };

    console.log('📝 Creating download record:', downloadRecord);

    // Initialize array if it doesn't exist
    if (!user.downloadedVideos) {
      user.downloadedVideos = [];
      console.log('📁 Initialized downloadedVideos array');
    }

    // Add to front of array
    user.downloadedVideos.unshift(downloadRecord);
    user.downloadsToday += 1;

    console.log(`💾 Saving user...`);
    console.log(`📊 Downloads array length before save: ${user.downloadedVideos.length}`);

    // Save user
    await user.save();

    // Verify it was saved
    const savedUser = await User.findById(decoded.userId);
    console.log(`✅ Verified - Downloads in DB after save: ${savedUser?.downloadedVideos?.length || 0}`);
    console.log(`📥 First download:`, savedUser?.downloadedVideos?.[0]);

    console.log(`✅ Download saved successfully: ${videoTitle}`);

    return NextResponse.json({
      success: true,
      message: 'Download saved!',
      download: downloadRecord,
      downloads: user.downloadedVideos,
      downloadsToday: user.downloadsToday,
      downloadsLeft: limit === Infinity ? 'Unlimited' : limit - user.downloadsToday,
      plan: user.plan,
    });

  } catch (error: any) {
    console.error('❌ POST Download error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}