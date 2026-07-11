import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
   
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    console.log(`📍 Client IP: ${ip}`);
    
    
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      
      const state = data.region || 'Unknown';
      const city = data.city || 'Unknown';
      const southStates = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana', 'TN', 'KL', 'KA', 'AP', 'TG'];
      const isSouthIndia = southStates.some(s => state.toLowerCase().includes(s.toLowerCase()));
      
      const now = new Date();
      const istHour = (now.getUTCHours() + 5 + 30/60) % 24;
      const isSpecialTime = istHour >= 10 && istHour < 12;
      const theme = (isSouthIndia && isSpecialTime) ? 'light' : 'dark';
      
      return NextResponse.json({
        city,
        state,
        isSouthIndia,
        theme,
        ip
      });
    } catch (ipError) {
      console.error('IP lookup failed:', ipError);
      
     
      return NextResponse.json({
        city: 'Unknown',
        state: 'Unknown',
        isSouthIndia: false,
        theme: 'dark',
        ip: 'unknown'
      });
    }
  } catch (error) {
    console.error('Location API error:', error);
    return NextResponse.json({
      city: 'Mumbai',
      state: 'Maharashtra',
      isSouthIndia: false,
      theme: 'dark'
    });
  }
}