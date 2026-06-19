import { NextRequest, NextResponse } from 'next/server';
import { getUserLocation, getTheme } from '@/lib/location';

declare global {
  var _users: any[];
  var _nextId: number;
}
global._users = global._users || [];
global._nextId = global._nextId || 1;

export async function POST(req: NextRequest) {
  try {
    const { username, email, phone, password } = await req.json();
    
    console.log('📝 Register:', { username, email, phone });
    
    if (!username || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }
    
    const existing = global._users.find((u: any) => u.email === email);
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    const newUser = {
      id: global._nextId++,
      username,
      email,
      phone: phone || '',
      password,
      plan: 'free', // free, bronze, silver, gold
      downloadsToday: 0,
      lastDownloadDate: new Date().toDateString(),
      downloadedVideos: [], // Array to store downloaded video info
      createdAt: new Date().toISOString(),
    };
    
    global._users.push(newUser);
    
    const location = await getUserLocation();
    const theme = getTheme(location);
    const token = Buffer.from(JSON.stringify({ userId: newUser.id, email: newUser.email })).toString('base64');
    
    return NextResponse.json({
      success: true,
      token,
      user: { 
        id: newUser.id, 
        username: newUser.username, 
        email: newUser.email, 
        plan: newUser.plan,
        downloadedVideos: []
      },
      theme,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}