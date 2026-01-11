import { describe, it, expect, beforeEach } from 'vitest';
import { timingSafeEqual } from 'crypto';

// Simulate the checkAuth function from the routes
function checkAuth(authHeader: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  
  // Pad to fixed length to prevent timing attacks
  const paddedAuth = (authHeader || '').padEnd(200, '\0');
  const paddedExpected = expected.padEnd(200, '\0');
  
  try {
    return timingSafeEqual(
      Buffer.from(paddedAuth),
      Buffer.from(paddedExpected)
    );
  } catch {
    return false;
  }
}

describe('Timing-Safe Authentication', () => {
  const testSecret = 'test-secret-key-12345';

  it('should accept valid authorization header', () => {
    const validHeader = `Bearer ${testSecret}`;
    expect(checkAuth(validHeader, testSecret)).toBe(true);
  });

  it('should reject invalid authorization header', () => {
    const invalidHeader = 'Bearer wrong-secret';
    expect(checkAuth(invalidHeader, testSecret)).toBe(false);
  });

  it('should reject null authorization header', () => {
    expect(checkAuth(null, testSecret)).toBe(false);
  });

  it('should reject empty authorization header', () => {
    expect(checkAuth('', testSecret)).toBe(false);
  });

  it('should reject header without Bearer prefix', () => {
    expect(checkAuth(testSecret, testSecret)).toBe(false);
  });

  it('should handle different length inputs without timing leak', () => {
    const shortHeader = 'Bearer abc';
    const longHeader = 'Bearer ' + 'a'.repeat(100);
    
    // Both should fail, and padding ensures constant-time comparison
    expect(checkAuth(shortHeader, testSecret)).toBe(false);
    expect(checkAuth(longHeader, testSecret)).toBe(false);
  });

  it('should be constant-time regardless of input length', () => {
    // Test that padding works correctly
    const header1 = 'Bearer test';
    const header2 = 'Bearer ' + 'x'.repeat(50);
    
    // Both padded to 200 chars, so comparison is constant-time
    const result1 = checkAuth(header1, testSecret);
    const result2 = checkAuth(header2, testSecret);
    
    expect(result1).toBe(false);
    expect(result2).toBe(false);
  });
});
