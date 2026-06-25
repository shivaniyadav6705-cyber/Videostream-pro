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
    const isSouthIndia = SOUTH_INDIAN_STATES.some(s => state.includes(s));
    return { state, city, isSouthIndia };
  } catch (error) {
    return { state: 'Maharashtra', city: 'Mumbai', isSouthIndia: false };
  }
}

export function getOTPMethod(location: { isSouthIndia: boolean }): 'email' | 'phone' {
  return location.isSouthIndia ? 'email' : 'phone';
}