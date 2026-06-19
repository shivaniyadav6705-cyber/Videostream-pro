import { NextRequest, NextResponse } from 'next/server';
import { getLocationFromIP, getTheme, getAuthMethod } from '@/lib/location';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const location = getLocationFromIP(ip);
  const theme = getTheme(location);
  const authMethod = getAuthMethod(location);
  
  return NextResponse.json({ location, theme, authMethod });
}