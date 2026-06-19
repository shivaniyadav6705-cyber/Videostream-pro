// South Indian states list (full names and codes)
const SOUTH_INDIAN_STATES = [
  'Tamil Nadu', 'TamilNadu', 'TN',
  'Kerala', 'KL',
  'Karnataka', 'KA',
  'Andhra Pradesh', 'AndhraPradesh', 'AP',
  'Telangana', 'TG', 'TS'
];

// Get real location from IP using free API
export async function getUserLocation(): Promise<{ state: string; city: string; isSouthIndia: boolean }> {
  try {
    // Using ipapi.co for accurate location detection
    const response = await fetch('https://ipapi.co/json/', {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error('Location API failed');
    }
    
    const data = await response.json();
    
    const state = data.region || 'Unknown';
    const city = data.city || 'Unknown';
    
    // Check if state is in South India
    const isSouthIndia = SOUTH_INDIAN_STATES.some(s => 
      state.toLowerCase().includes(s.toLowerCase()) || 
      s.toLowerCase().includes(state.toLowerCase())
    );
    
    console.log(`📍 Location detected: ${city}, ${state} - South India: ${isSouthIndia}`);
    
    return { state, city, isSouthIndia };
  } catch (error) {
    console.error('Location detection failed:', error);
    // Default fallback - you can change this based on your testing needs
    return { state: 'Maharashtra', city: 'Mumbai', isSouthIndia: false };
  }
}

// Get current time in IST
export function getCurrentISTHour(): number {
  const now = new Date();
  // Convert UTC to IST (UTC + 5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.getHours();
}

// Determine theme based on location and time
export function getTheme(location: { isSouthIndia: boolean }): 'light' | 'dark' {
  const currentHour = getCurrentISTHour();
  const isSpecialTime = currentHour >= 10 && currentHour < 12;
  
  // Light theme only for South India between 10 AM - 12 PM IST
  if (location.isSouthIndia && isSpecialTime) {
    return 'light';
  }
  return 'dark';
}

// Determine OTP delivery method based on location
export function getOTPMethod(location: { isSouthIndia: boolean }): 'email' | 'phone' {
  return location.isSouthIndia ? 'email' : 'phone';
}