/**
 * Password utility functions for generating and validating secure passwords
 */

// Password complexity requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
};

export const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generates a cryptographically secure password that meets all complexity requirements
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = SPECIAL_CHARS;
  
  const allChars = uppercase + lowercase + digits + special;
  
  // Ensure at least one of each required type
  const result: string[] = [];
  
  // Add required characters
  result.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
  result.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
  result.push(digits[Math.floor(Math.random() * digits.length)]);
  result.push(special[Math.floor(Math.random() * special.length)]);
  
  // Fill the rest with random characters
  for (let i = result.length; i < length; i++) {
    result.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Shuffle the array to avoid predictable positions
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result.join('');
}

/**
 * Validates password against complexity requirements
 * Returns an object with validation status and error messages
 */
export function validatePassword(password: string): { 
  valid: boolean; 
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Au moins ${PASSWORD_REQUIREMENTS.minLength} caractères`);
  }
  
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Au moins une majuscule');
  }
  
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Au moins une minuscule');
  }
  
  if (PASSWORD_REQUIREMENTS.requireDigit && !/[0-9]/.test(password)) {
    errors.push('Au moins un chiffre');
  }
  
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Au moins un caractère spécial (!@#$%^&*...)');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    if (password.length >= 16) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }
  } else if (errors.length <= 2 && password.length >= 8) {
    strength = 'medium';
  }
  
  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Get password strength color for UI
 */
export function getStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'bg-destructive';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
  }
}

/**
 * Get password strength label
 */
export function getStrengthLabel(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'Faible';
    case 'medium':
      return 'Moyen';
    case 'strong':
      return 'Fort';
  }
}
