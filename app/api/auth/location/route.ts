import { NextResponse } from 'next/server';
import { getLocationFromIP, getTheme, getOTPMethod } from '@/lib/location';

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const location = await getLocationFromIP(ip);
    const theme = getTheme(location);
    const authMethod = getOTPMethod(location);
    
    return NextResponse.json({
      city: location.city,
      state: location.state,
      isSouthIndia: location.isSouthIndia,
      theme,
      authMethod,
      message: location.isSouthIndia 
        ? 'South India detected - Light theme & Email OTP' 
        : 'Other region detected - Dark theme & SMS OTP'
    });
  } catch (error) {
    console.error('Location API error:', error);
    return NextResponse.json({
      city: 'Unknown',
      state: 'Unknown',
      isSouthIndia: false,
      theme: 'dark',
      authMethod: 'phone',
      message: 'Could not detect location'
    });
  }
}