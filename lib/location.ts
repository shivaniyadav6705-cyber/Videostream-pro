
const SOUTH_INDIAN_STATES = [
  'Tamil Nadu', 'TamilNadu', 'TN',
  'Kerala', 'KL',
  'Karnataka', 'KA',
  'Andhra Pradesh', 'AndhraPradesh', 'AP',
  'Telangana', 'TG', 'TS'
];


export async function getLocationFromIP(ip: string): Promise<{ state: string; city: string; isSouthIndia: boolean }> {
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


export function getOTPMethod(location: { isSouthIndia: boolean }): 'email' | 'phone' {
  return location.isSouthIndia ? 'email' : 'phone';
}


export function getTheme(location: { isSouthIndia: boolean }): 'light' | 'dark' {
  const hour = new Date().getHours();
  const isSpecialTime = hour >= 10 && hour < 12;
  
  if (location.isSouthIndia && isSpecialTime) {
    return 'light';
  }
  return 'dark';
}