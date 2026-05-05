import { ENVIRONMENT_NAMES, isProductionEnvironment } from './environment';

describe('environment', () => {
  describe('ENVIRONMENT_NAMES', () => {
    it('should have correct environment name constants', () => {
      expect(ENVIRONMENT_NAMES.PROD).toBe('prod');
      expect(ENVIRONMENT_NAMES.DEV).toBe('dev');
      expect(ENVIRONMENT_NAMES.UAT).toBe('uat');
      expect(ENVIRONMENT_NAMES.TEST).toBe('test');
      expect(ENVIRONMENT_NAMES.TOOLS).toBe('tools');
    });
  });

  describe('isProductionEnvironment', () => {
    it('should return true for production environment (lowercase)', () => {
      expect(isProductionEnvironment('prod')).toBe(true);
    });

    it('should return true for production environment (uppercase)', () => {
      expect(isProductionEnvironment('PROD')).toBe(true);
    });

    it('should return true for production environment (mixed case)', () => {
      expect(isProductionEnvironment('Prod')).toBe(true);
      expect(isProductionEnvironment('PrOd')).toBe(true);
    });

    it('should return false for non-production environments', () => {
      expect(isProductionEnvironment('dev')).toBe(false);
      expect(isProductionEnvironment('uat')).toBe(false);
      expect(isProductionEnvironment('test')).toBe(false);
      expect(isProductionEnvironment('tools')).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isProductionEnvironment(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isProductionEnvironment('')).toBe(false);
    });

    it('should return false for invalid environment names', () => {
      expect(isProductionEnvironment('production')).toBe(false);
      expect(isProductionEnvironment('staging')).toBe(false);
      expect(isProductionEnvironment('local')).toBe(false);
    });
  });
});
