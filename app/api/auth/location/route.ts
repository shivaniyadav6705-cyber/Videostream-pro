import { NextResponse } from 'next/server';
import { getUserLocation, getTheme, getOTPMethod } from '@/lib/location';

export async function GET() {
  try {
    const location = await getUserLocation();
    const theme = getTheme(location);
    const authMethod = getOTPMethod(location);
    
    console.log(`📍 Location API: ${location.city}, ${location.state} - South: ${location.isSouthIndia} - Theme: ${theme} - OTP: ${authMethod}`);
    
    return NextResponse.json({
      city: location.city,
      state: location.state,
      isSouthIndia: location.isSouthIndia,
      theme: theme,
      authMethod: authMethod,
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