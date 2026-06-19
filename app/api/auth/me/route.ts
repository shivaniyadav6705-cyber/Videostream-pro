import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json({ error: 'No token' }, { status: 401 });
    }
    
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const users = (global as any).__users || [];
      const user = users.find((u: any) => u.id === decoded.userId);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          plan: user.plan
        }
      });
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}