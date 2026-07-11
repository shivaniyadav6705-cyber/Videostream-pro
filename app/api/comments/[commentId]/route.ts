import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Comment from '@/models/Comment';
import jwt from 'jsonwebtoken';


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await connectDB();
    const { commentId } = await params; 
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    comment.likes += 1;
    await comment.save();

    return NextResponse.json({ 
      likes: comment.likes, 
      dislikes: comment.dislikes 
    });
  } catch (error: any) {
    console.error('❌ Like error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await connectDB();
    const { commentId } = await params; 
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    comment.dislikes += 1;
    
    
    let removed = false;
    if (comment.dislikes >= 2) {
      comment.removed = true;
      removed = true;
    }
    
    await comment.save();

    return NextResponse.json({ 
      likes: comment.likes, 
      dislikes: comment.dislikes,
      removed: removed
    });
  } catch (error: any) {
    console.error('❌ Dislike error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    await connectDB();
    const { commentId } = await params; 
    const { action } = await req.json();
    
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'like') {
      comment.likes += 1;
    } else if (action === 'dislike') {
      comment.dislikes += 1;
      if (comment.dislikes >= 2) {
        comment.removed = true;
      }
    }

    await comment.save();

    return NextResponse.json({ 
      likes: comment.likes, 
      dislikes: comment.dislikes,
      removed: comment.removed
    });
  } catch (error: any) {
    console.error('❌ Update comment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}