// Utility functions for authentication management

export function clearAuthData() {
  localStorage.removeItem('eldercompanion_token');
  // Clear any cached queries related to auth
  window.location.reload();
}

export function setAuthToken(token: string) {
  localStorage.setItem('eldercompanion_token', token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem('eldercompanion_token');
}

export function isTokenValid(token: string): boolean {
  if (!token) return false;
  
  try {
    // Basic JWT structure check (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Check if payload can be parsed (basic validation)
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}