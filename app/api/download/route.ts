import { NextRequest, NextResponse } from 'next/server';

declare global {
  var _users: any[];
}
global._users = global._users || [];

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const { videoId, videoTitle, videoDuration, videoThumbnail } = await req.json();

    // Find user
    const userIndex = global._users.findIndex((u: any) => u.id === decoded.userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = global._users[userIndex];
    const today = new Date().toDateString();

    // Reset download count for new day
    if (user.lastDownloadDate !== today) {
      user.downloadsToday = 0;
      user.lastDownloadDate = today;
    }

    // Check download limits based on plan
    const planLimits: Record<string, number> = {
      free: 1,
      bronze: Infinity,
      silver: Infinity,
      gold: Infinity,
    };

    const limit = planLimits[user.plan] || 1;

    if (user.downloadsToday >= limit) {
      return NextResponse.json({ 
        error: `Daily download limit reached. ${user.plan === 'free' ? 'Upgrade to premium for unlimited downloads!' : 'You have reached your limit.'}` 
      }, { status: 403 });
    }

    // Create download record
    const downloadRecord = {
      id: Date.now(),
      videoId,
      videoTitle,
      videoDuration,
      videoThumbnail: videoThumbnail || '🎬',
      downloadedAt: new Date().toISOString(),
    };

    // Add to user's downloaded videos
    if (!user.downloadedVideos) {
      user.downloadedVideos = [];
    }
    user.downloadedVideos.unshift(downloadRecord); // Add to beginning (newest first)

    // Increment download count
    user.downloadsToday += 1;

    // Save back to global storage
    global._users[userIndex] = user;

    console.log(`✅ Download recorded: ${videoTitle} by ${user.username}`);
    console.log(`📊 Downloads today: ${user.downloadsToday}/${limit === Infinity ? '∞' : limit}`);

    return NextResponse.json({
      success: true,
      message: 'Download started!',
      download: downloadRecord,
      downloadsLeft: limit === Infinity ? 'Unlimited' : limit - user.downloadsToday,
      plan: user.plan,
    });
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get user's downloaded videos
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = global._users.find((u: any) => u.id === decoded.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      downloads: user.downloadedVideos || [],
      downloadsToday: user.downloadsToday || 0,
      plan: user.plan,
    });
  } catch (error: any) {
    console.error('Get downloads error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}