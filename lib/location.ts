// South Indian states list
const SOUTH_INDIAN_STATES = [
  'Tamil Nadu', 'TamilNadu', 'TN',
  'Kerala', 'KL',
  'Karnataka', 'KA',
  'Andhra Pradesh', 'AndhraPradesh', 'AP',
  'Telangana', 'TG', 'TS'
];

// ============================================
// CLIENT-SIDE LOCATION (Works on Vercel)
// ============================================
export async function getUserLocation(): Promise<{ state: string; city: string; isSouthIndia: boolean }> {
  try {
    // Try browser's geolocation API first (most accurate)
    if (typeof window !== 'undefined' && navigator.geolocation) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      // Use reverse geocoding to get location from coordinates
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      const state = data.principalSubdivision || 'Unknown';
      const city = data.city || data.locality || 'Unknown';
      
      const isSouthIndia = SOUTH_INDIAN_STATES.some(s => 
        state.toLowerCase().includes(s.toLowerCase()) || 
        s.toLowerCase().includes(state.toLowerCase())
      );
      
      console.log(`📍 Location (Geolocation): ${city}, ${state} - South: ${isSouthIndia}`);
      return { state, city, isSouthIndia };
    }
    
    // Fallback: IP-based location detection
    const response = await fetch('https://ipapi.co/json/', {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error('IP location API failed');
    }
    
    const data = await response.json();
    const state = data.region || 'Unknown';
    const city = data.city || 'Unknown';
    const isSouthIndia = SOUTH_INDIAN_STATES.some(s => 
      state.toLowerCase().includes(s.toLowerCase()) || 
      s.toLowerCase().includes(state.toLowerCase())
    );
    
    console.log(`📍 Location (IP): ${city}, ${state} - South: ${isSouthIndia}`);
    return { state, city, isSouthIndia };
    
  } catch (error) {
    console.error('Location detection failed:', error);
    // Default fallback
    return { state: 'Maharashtra', city: 'Mumbai', isSouthIndia: false };
  }
}

// Get current time in IST
export function getCurrentISTHour(): number {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.getHours();
}

// Determine theme based on location and time
export function getTheme(location: { isSouthIndia: boolean }): 'light' | 'dark' {
  const currentHour = getCurrentISTHour();
  const isSpecialTime = currentHour >= 10 && currentHour < 12;
  
  if (location.isSouthIndia && isSpecialTime) {
    return 'light';
  }
  return 'dark';
}

// Determine OTP delivery method based on location
export function getOTPMethod(location: { isSouthIndia: boolean }): 'email' | 'phone' {
  return location.isSouthIndia ? 'email' : 'phone';
}