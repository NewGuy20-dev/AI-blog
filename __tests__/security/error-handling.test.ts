import { describe, it, expect } from 'vitest';

enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Simulate error response generation
function generateErrorResponse(error: Error, code: ErrorCode) {
  // Log detailed error server-side only (not returned to client)
  console.error('[Server Error]', error);
  
  // Return generic error to client
  return {
    error: getGenericErrorMessage(code),
    code: code,
  };
}

function getGenericErrorMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
      return 'Authentication required';
    case ErrorCode.FORBIDDEN:
      return 'Access denied';
    case ErrorCode.VALIDATION_ERROR:
      return 'Invalid request';
    case ErrorCode.INTERNAL_ERROR:
      return 'Operation failed';
    default:
      return 'An error occurred';
  }
}

describe('Error Handling Security', () => {
  describe('Generic Error Messages', () => {
    it('should return generic message for UNAUTHORIZED', () => {
      const error = new Error('User session expired at 2024-01-01');
      const response = generateErrorResponse(error, ErrorCode.UNAUTHORIZED);
      
      expect(response.error).toBe('Authentication required');
      expect(response.error).not.toContain('session');
      expect(response.error).not.toContain('2024-01-01');
    });

    it('should return generic message for FORBIDDEN', () => {
      const error = new Error('User lacks admin role in database table users');
      const response = generateErrorResponse(error, ErrorCode.FORBIDDEN);
      
      expect(response.error).toBe('Access denied');
      expect(response.error).not.toContain('admin');
      expect(response.error).not.toContain('database');
      expect(response.error).not.toContain('users');
    });

    it('should return generic message for VALIDATION_ERROR', () => {
      const error = new Error('Field "password" must be at least 8 characters');
      const response = generateErrorResponse(error, ErrorCode.VALIDATION_ERROR);
      
      expect(response.error).toBe('Invalid request');
      expect(response.error).not.toContain('password');
      expect(response.error).not.toContain('8 characters');
    });

    it('should return generic message for INTERNAL_ERROR', () => {
      const error = new Error('Database connection failed at host 192.168.1.1:5432');
      const response = generateErrorResponse(error, ErrorCode.INTERNAL_ERROR);
      
      expect(response.error).toBe('Operation failed');
      expect(response.error).not.toContain('Database');
      expect(response.error).not.toContain('192.168.1.1');
      expect(response.error).not.toContain('5432');
    });
  });

  describe('Error Codes', () => {
    it('should include error code in response', () => {
      const error = new Error('Some error');
      const response = generateErrorResponse(error, ErrorCode.UNAUTHORIZED);
      
      expect(response.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should use correct error code for each error type', () => {
      const error = new Error('Test');
      
      expect(generateErrorResponse(error, ErrorCode.UNAUTHORIZED).code).toBe('UNAUTHORIZED');
      expect(generateErrorResponse(error, ErrorCode.FORBIDDEN).code).toBe('FORBIDDEN');
      expect(generateErrorResponse(error, ErrorCode.VALIDATION_ERROR).code).toBe('VALIDATION_ERROR');
      expect(generateErrorResponse(error, ErrorCode.INTERNAL_ERROR).code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Information Leakage Prevention', () => {
    it('should not leak stack traces', () => {
      const error = new Error('Test error');
      const response = generateErrorResponse(error, ErrorCode.INTERNAL_ERROR);
      
      expect(JSON.stringify(response)).not.toContain('stack');
      expect(JSON.stringify(response)).not.toContain('at Object');
    });

    it('should not leak file paths', () => {
      const error = new Error('Failed to read /var/www/app/config/secrets.json');
      const response = generateErrorResponse(error, ErrorCode.INTERNAL_ERROR);
      
      expect(response.error).not.toContain('/var/www');
      expect(response.error).not.toContain('secrets.json');
    });

    it('should not leak database schema information', () => {
      const error = new Error('Column "user_password_hash" does not exist in table "users"');
      const response = generateErrorResponse(error, ErrorCode.INTERNAL_ERROR);
      
      expect(response.error).not.toContain('user_password_hash');
      expect(response.error).not.toContain('table');
      expect(response.error).not.toContain('Column');
    });

    it('should not leak API keys or tokens', () => {
      const error = new Error('Invalid API key: sk_live_abc123xyz789');
      const response = generateErrorResponse(error, ErrorCode.INTERNAL_ERROR);
      
      expect(response.error).not.toContain('sk_live');
      expect(response.error).not.toContain('abc123xyz789');
    });
  });
});
