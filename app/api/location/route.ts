import { NextRequest, NextResponse } from 'next/server';
import { getUserLocation, getTheme, getOTPMethod } from '@/lib/location';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const location =await getUserLocation();
  const theme = getTheme(location);
  const authMethod = getOTPMethod(location);
  
  return NextResponse.json({ location, theme, authMethod });
}