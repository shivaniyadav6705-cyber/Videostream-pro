// ============================================
// AUTH UTILITIES - Uses sessionStorage for multi-tab support
// ============================================

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('token');
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('token');
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('user', JSON.stringify(user));
}

export function removeUser(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('user');
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('token');
}

// Sync from localStorage to sessionStorage (for existing users)
export function syncFromLocalStorage(): void {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && !sessionStorage.getItem('token')) {
    sessionStorage.setItem('token', token);
  }
  if (user && !sessionStorage.getItem('user')) {
    sessionStorage.setItem('user', JSON.stringify(JSON.parse(user)));
  }
}