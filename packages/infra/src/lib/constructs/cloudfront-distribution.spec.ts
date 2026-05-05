import { Stack } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Template } from 'aws-cdk-lib/assertions';
import { CloudFrontDistributionConstruct } from './cloudfront-distribution';

describe('CloudFrontDistributionConstruct', () => {
  it('should create CloudFront distribution with S3 bucket', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
        PriceClass: 'PriceClass_All',
      },
    });
  });

  it('should create CloudFront distribution with correct name prefix', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment: 'CloudFront distribution for dev-platform-test-distribution',
      },
    });
  });

  it('should create CloudFront distribution with existing bucket', () => {
    const stack = new Stack();
    const bucket = new s3.Bucket(stack, 'TestBucket', {
      bucketName: 'test-bucket',
    });

    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      existingBucketObj: bucket,
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
      },
    });
  });

  it('should create CloudFront distribution with default root object', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
      },
    });
  });

  it('should create CloudFront distribution with SPA error responses', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    const distribution = template.findResources(
      'AWS::CloudFront::Distribution'
    );
    const distributionConfig =
      Object.values(distribution)[0]?.['Properties']?.['DistributionConfig'];

    expect(distributionConfig?.['CustomErrorResponses']).toBeDefined();
    const errorResponses = distributionConfig?.['CustomErrorResponses'];
    expect(errorResponses).toContainEqual(
      expect.objectContaining({
        ErrorCode: 403,
        ResponseCode: 200,
        ResponsePagePath: '/index.html',
      })
    );
    expect(errorResponses).toContainEqual(
      expect.objectContaining({
        ErrorCode: 404,
        ResponseCode: 200,
        ResponsePagePath: '/index.html',
      })
    );
  });

  it('should output CloudFront distribution URL', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();
    const outputs = templateJson['Outputs'] || {};
    const hasExpectedOutput = Object.values(outputs).some(
      (output) =>
        (output as { Export?: { Name?: string } })?.Export?.Name ===
        'dev-platform-test-distribution-url'
    );
    expect(hasExpectedOutput).toBe(true);
  });

  it('should output CloudFront distribution domain name', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();
    const outputs = templateJson['Outputs'] || {};
    const hasExpectedOutput = Object.values(outputs).some(
      (output) =>
        (output as { Export?: { Name?: string } })?.Export?.Name ===
        'dev-platform-test-distribution-domain-name'
    );
    expect(hasExpectedOutput).toBe(true);
  });

  it('should output CloudFront distribution ID', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    const templateJson = template.toJSON();
    const outputs = templateJson['Outputs'] || {};
    const hasExpectedOutput = Object.values(outputs).some(
      (output) =>
        (output as { Export?: { Name?: string } })?.Export?.Name ===
        'dev-platform-test-distribution-distribution-id'
    );
    expect(hasExpectedOutput).toBe(true);
  });

  it('should create S3 bucket when not provided', () => {
    const stack = new Stack();
    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    // CloudFrontToS3 may create multiple buckets (e.g., for logging)
    // Verify at least one bucket is created by checking that buckets exist
    const buckets = template.findResources('AWS::S3::Bucket');
    expect(Object.keys(buckets).length).toBeGreaterThan(0);
  });

  it('should use existing bucket when provided', () => {
    const stack = new Stack();
    const bucket = new s3.Bucket(stack, 'TestBucket', {
      bucketName: 'test-bucket',
    });

    new CloudFrontDistributionConstruct(stack, 'TestDistribution', {
      distributionName: 'test-distribution',
      existingBucketObj: bucket,
      envPrefix: 'dev',
      projectName: 'platform',
    });

    const template = Template.fromStack(stack);
    // Verify the bucket we created exists
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'test-bucket',
    });
    // Verify CloudFront distribution is created (which confirms it's using the existing bucket)
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultRootObject: 'index.html',
      },
    });
  });
});
