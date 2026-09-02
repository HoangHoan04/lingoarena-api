export type UsernameType = 'email' | 'phone' | 'unknown';

export function identifyUsername(username: string): UsernameType {
  if (!username) return 'unknown';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(username)) {
    return 'email';
  }
  const phoneRegex = /^(?:\+84|0)\d{9,10}$/;
  if (phoneRegex.test(username)) {
    return 'phone';
  }

  return 'unknown';
}
