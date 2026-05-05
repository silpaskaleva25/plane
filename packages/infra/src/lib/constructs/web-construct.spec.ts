import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { WebConstruct } from './web-construct';

describe('WebConstruct', () => {
  it('should create CloudFront distribution', () => {
    const stack = new Stack();
    new WebConstruct(stack, 'TestWeb', {
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    // Verify CloudFront distribution is created
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  it('should create CloudFront distribution without envPrefix', () => {
    const stack = new Stack();
    new WebConstruct(stack, 'TestWeb', {
      projectName: 'platform',
      envPrefix: '',
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
  });

  it('should output CloudFront URL with correct export name', () => {
    const stack = new Stack();
    new WebConstruct(stack, 'TestWeb', {
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();
    const outputs = templateJson['Outputs'] || {};
    const hasExpectedOutput = Object.values(outputs).some(
      (output) =>
        (output as { Export?: { Name?: string } })?.Export?.Name ===
        'dev-platform-DemoCloudFrontUrl'
    );
    expect(hasExpectedOutput).toBe(true);
  });

  it('should output CloudFront URL without envPrefix', () => {
    const stack = new Stack();
    new WebConstruct(stack, 'TestWeb', {
      projectName: 'platform',
      envPrefix: '',
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();
    const outputs = templateJson['Outputs'] || {};
    const hasExpectedOutput = Object.values(outputs).some(
      (output) =>
        (output as { Export?: { Name?: string } })?.Export?.Name ===
        'platform-DemoCloudFrontUrl'
    );
    expect(hasExpectedOutput).toBe(true);
  });

  it('should output CloudFront Distribution ID', () => {
    const stack = new Stack();
    new WebConstruct(stack, 'TestWeb', {
      envPrefix: 'prod',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();
    const outputs = templateJson['Outputs'] || {};
    const hasExpectedOutput = Object.values(outputs).some(
      (output) =>
        (output as { Export?: { Name?: string } })?.Export?.Name ===
        'prod-platform-DemoCloudFrontDistributionId'
    );
    expect(hasExpectedOutput).toBe(true);
  });

  it('should output S3 bucket name when bucket exists', () => {
    const stack = new Stack();
    new WebConstruct(stack, 'TestWeb', {
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();
    const outputs = templateJson['Outputs'] || {};
    const hasExpectedOutput = Object.values(outputs).some(
      (output) =>
        (output as { Export?: { Name?: string } })?.Export?.Name ===
        'dev-platform-DemoS3BucketUi'
    );
    expect(hasExpectedOutput).toBe(true);
  });

  it('should create S3 bucket for CloudFront', () => {
    const stack = new Stack();
    new WebConstruct(stack, 'TestWeb', {
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    // Verify S3 bucket is created
    template.hasResourceProperties('AWS::S3::Bucket', {});
  });
});
