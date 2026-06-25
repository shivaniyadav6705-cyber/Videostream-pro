// South Indian states
const SOUTH_INDIAN_STATES = [
  'Tamil Nadu', 'TamilNadu', 'TN',
  'Kerala', 'KL',
  'Karnataka', 'KA',
  'Andhra Pradesh', 'AndhraPradesh', 'AP',
  'Telangana', 'TG', 'TS'
];

// Get location from IP (using free API)
export async function getUserLocation(): Promise<{ state: string; city: string; isSouthIndia: boolean }> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const state = data.region || 'Unknown';
    const city = data.city || 'Unknown';
    
    const isSouthIndia = SOUTH_INDIAN_STATES.some(s => 
      state.toLowerCase().includes(s.toLowerCase()) || 
      s.toLowerCase().includes(state.toLowerCase())
    );
    
    console.log(`📍 Location detected: ${city}, ${state} - South India: ${isSouthIndia}`);
    return { state, city, isSouthIndia };
  } catch (error) {
    console.error('Location detection failed:', error);
    return { state: 'Unknown', city: 'Unknown', isSouthIndia: false };
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

// Function to get location from IP (alias for getUserLocation)
export async function getLocationFromIP(ip: string): Promise<{ state: string; city: string; isSouthIndia: boolean }> {
  return await getUserLocation();
}