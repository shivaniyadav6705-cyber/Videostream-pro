import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Comment from '@/models/Comment';
import jwt from 'jsonwebtoken';

// GET - Fetch comments for a video
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const comments = await Comment.find({
      videoId,
      removed: false
    })
    .sort({ createdAt: -1 })
    .limit(100);

    return NextResponse.json({ comments });
  } catch (error: any) {
    console.error('❌ Get comments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new comment
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { videoId, text, city } = body;

    // Get token
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Login required to comment' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database or use decoded info
    const username = decoded.username || 'User';

    // Check for special characters
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    if (specialChars.test(text)) {
      return NextResponse.json({ 
        error: 'Comments cannot contain special characters' 
      }, { status: 400 });
    }

    const comment = await Comment.create({
      videoId,
      userId: decoded.userId,
      username,
      text,
      city: city || 'Unknown',
      likes: 0,
      dislikes: 0,
      removed: false,
    });

    return NextResponse.json({ 
      success: true, 
      comment 
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Post comment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}