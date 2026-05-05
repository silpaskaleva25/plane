import { NameHelper } from './name-helper';

describe('NameHelper', () => {
  describe('constructor', () => {
    it('should create instance with project name and env prefix', () => {
      const helper = new NameHelper('platform', 'dev');
      expect(helper).toBeInstanceOf(NameHelper);
    });

    it('should create instance with project name only', () => {
      const helper = new NameHelper('platform');
      expect(helper).toBeInstanceOf(NameHelper);
    });
  });

  describe('name', () => {
    it('should return name with env prefix and project name', () => {
      const helper = new NameHelper('platform', 'dev');
      expect(helper.name('api')).toBe('dev-platform-api');
    });

    it('should return name with only project name when env prefix is empty', () => {
      const helper = new NameHelper('platform');
      expect(helper.name('api')).toBe('platform-api');
    });

    it('should return name with only project name when env prefix is empty string', () => {
      const helper = new NameHelper('platform', '');
      expect(helper.name('api')).toBe('platform-api');
    });

    it('should handle complex resource names', () => {
      const helper = new NameHelper('platform', 'prod');
      expect(helper.name('api-cluster')).toBe('prod-platform-api-cluster');
      expect(helper.name('web-service')).toBe('prod-platform-web-service');
    });

    it('should handle different project names', () => {
      const helper = new NameHelper('myproject', 'dev');
      expect(helper.name('api')).toBe('dev-myproject-api');
    });

    it('should handle different environment prefixes', () => {
      const helper = new NameHelper('platform', 'uat');
      expect(helper.name('api')).toBe('uat-platform-api');
    });
  });

  describe('createStackParameterName', () => {
    it('should create SSM parameter name with env prefix', () => {
      const helper = new NameHelper('platform', 'dev');
      const paramName = helper.createStackParameterName('api-stack', 'vpc-id');
      expect(paramName).toBe('/dev/api-stack/vpc-id');
    });

    it('should create SSM parameter name without env prefix when empty', () => {
      const helper = new NameHelper('platform');
      const paramName = helper.createStackParameterName('api-stack', 'vpc-id');
      expect(paramName).toBe('//api-stack/vpc-id');
    });

    it('should create SSM parameter name with empty string env prefix', () => {
      const helper = new NameHelper('platform', '');
      const paramName = helper.createStackParameterName('api-stack', 'vpc-id');
      expect(paramName).toBe('//api-stack/vpc-id');
    });

    it('should handle different stack names and parameter names', () => {
      const helper = new NameHelper('platform', 'prod');
      expect(helper.createStackParameterName('web-stack', 'bucket-name')).toBe(
        '/prod/web-stack/bucket-name'
      );
      expect(helper.createStackParameterName('api-stack', 'endpoint-url')).toBe(
        '/prod/api-stack/endpoint-url'
      );
    });

    it('should handle complex parameter names', () => {
      const helper = new NameHelper('platform', 'dev');
      const paramName = helper.createStackParameterName(
        'api-stack',
        'vpc/subnet/app-id'
      );
      expect(paramName).toBe('/dev/api-stack/vpc/subnet/app-id');
    });
  });
});
