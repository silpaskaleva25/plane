import { Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { lookupVpcByEnv, subnetByEnvAndNameFilter } from './vpc-lookup';

// Mock StringParameter.valueFromLookup
jest.mock('aws-cdk-lib/aws-ssm', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-ssm');
  return {
    ...actual,
    StringParameter: {
      ...actual.StringParameter,
      valueFromLookup: jest.fn((scope, paramName) => {
        // Return a mock subnet ID based on the parameter name
        // Format: /PBMMAccel/network/vpc/1/net/{index}/{az}/id
        if (paramName.includes('/aza/id')) {
          return 'subnet-aza-mock';
        }
        if (paramName.includes('/azb/id')) {
          return 'subnet-azb-mock';
        }
        return 'subnet-mock';
      }),
    },
  };
});

// Mock Vpc.fromLookup to return an actual VPC
jest.mock('aws-cdk-lib/aws-ec2', () => {
  const actual = jest.requireActual('aws-cdk-lib/aws-ec2');
  return {
    ...actual,
    Vpc: {
      ...actual.Vpc,
      fromLookup: jest.fn((scope, id, options) => {
        const stack = Stack.of(scope);
        return new actual.Vpc(stack, id, {
          vpcName: options.tags.Name,
        });
      }),
    },
  };
});

describe('vpc-lookup', () => {
  describe('lookupVpcByEnv', () => {
    it('should lookup VPC with correct name tag', () => {
      const stack = new Stack();
      const vpc = lookupVpcByEnv(stack, 'TestId', 'dev');

      expect(vpc).toBeDefined();
      expect(ec2.Vpc.fromLookup).toHaveBeenCalledWith(
        stack,
        'TestId_Vpc_Lookup',
        {
          tags: { Name: 'dev_vpc' },
        }
      );
    });

    it('should handle different vpc prefixes', () => {
      const stack = new Stack();
      lookupVpcByEnv(stack, 'TestId', 'prod');

      expect(ec2.Vpc.fromLookup).toHaveBeenCalledWith(
        stack,
        'TestId_Vpc_Lookup',
        {
          tags: { Name: 'prod_vpc' },
        }
      );
    });

    it('should handle empty vpc prefix', () => {
      const stack = new Stack();
      lookupVpcByEnv(stack, 'TestId', '');

      expect(ec2.Vpc.fromLookup).toHaveBeenCalledWith(
        stack,
        'TestId_Vpc_Lookup',
        {
          tags: { Name: '_vpc' },
        }
      );
    });

    it('should use unique id for lookup', () => {
      const stack = new Stack();
      lookupVpcByEnv(stack, 'ApiStack', 'dev');
      lookupVpcByEnv(stack, 'WebStack', 'dev');

      expect(ec2.Vpc.fromLookup).toHaveBeenCalledWith(
        stack,
        'ApiStack_Vpc_Lookup',
        expect.any(Object)
      );
      expect(ec2.Vpc.fromLookup).toHaveBeenCalledWith(
        stack,
        'WebStack_Vpc_Lookup',
        expect.any(Object)
      );
    });
  });

  describe('subnetByEnvAndNameFilter', () => {
    it('should return filter function for App subnets', () => {
      const stack = new Stack();
      const filter = subnetByEnvAndNameFilter(stack, 'App');

      expect(filter).toBeInstanceOf(Function);

      // Create mock subnets
      const mockSubnets = [
        { subnetId: 'subnet-aza-mock' } as ec2.ISubnet,
        { subnetId: 'subnet-azb-mock' } as ec2.ISubnet,
        { subnetId: 'subnet-other' } as ec2.ISubnet,
      ];

      const filtered = filter(mockSubnets);
      expect(filtered).toHaveLength(2);
      expect(filtered).toContainEqual({ subnetId: 'subnet-aza-mock' });
      expect(filtered).toContainEqual({ subnetId: 'subnet-azb-mock' });
    });

    it('should return filter function for Web subnets', () => {
      const stack = new Stack();
      const filter = subnetByEnvAndNameFilter(stack, 'Web');

      expect(filter).toBeInstanceOf(Function);

      const mockSubnets = [
        { subnetId: 'subnet-aza-mock' } as ec2.ISubnet,
        { subnetId: 'subnet-azb-mock' } as ec2.ISubnet,
        { subnetId: 'subnet-other' } as ec2.ISubnet,
      ];

      const filtered = filter(mockSubnets);
      expect(filtered).toHaveLength(2);
      expect(filtered).toContainEqual({ subnetId: 'subnet-aza-mock' });
      expect(filtered).toContainEqual({ subnetId: 'subnet-azb-mock' });
    });

    it('should return filter function for Data subnets', () => {
      const stack = new Stack();
      const filter = subnetByEnvAndNameFilter(stack, 'Data');

      expect(filter).toBeInstanceOf(Function);

      const mockSubnets = [
        { subnetId: 'subnet-aza-mock' } as ec2.ISubnet,
        { subnetId: 'subnet-azb-mock' } as ec2.ISubnet,
        { subnetId: 'subnet-other' } as ec2.ISubnet,
      ];

      const filtered = filter(mockSubnets);
      expect(filtered).toHaveLength(2);
      expect(filtered).toContainEqual({ subnetId: 'subnet-aza-mock' });
      expect(filtered).toContainEqual({ subnetId: 'subnet-azb-mock' });
    });

    it('should filter out subnets not matching the lookup IDs', () => {
      const stack = new Stack();
      const filter = subnetByEnvAndNameFilter(stack, 'App');

      const mockSubnets = [
        { subnetId: 'subnet-aza-mock' } as ec2.ISubnet,
        { subnetId: 'subnet-unmatched-1' } as ec2.ISubnet,
        { subnetId: 'subnet-unmatched-2' } as ec2.ISubnet,
        { subnetId: 'subnet-azb-mock' } as ec2.ISubnet,
      ];

      const filtered = filter(mockSubnets);
      expect(filtered).toHaveLength(2);
      expect(filtered).not.toContainEqual({
        subnetId: 'subnet-unmatched-1',
      });
      expect(filtered).not.toContainEqual({
        subnetId: 'subnet-unmatched-2',
      });
    });

    it('should return empty array when no subnets match', () => {
      const stack = new Stack();
      const filter = subnetByEnvAndNameFilter(stack, 'App');

      const mockSubnets = [
        { subnetId: 'subnet-unmatched-1' } as ec2.ISubnet,
        { subnetId: 'subnet-unmatched-2' } as ec2.ISubnet,
      ];

      const filtered = filter(mockSubnets);
      expect(filtered).toHaveLength(0);
    });

    it('should return empty array when input is empty', () => {
      const stack = new Stack();
      const filter = subnetByEnvAndNameFilter(stack, 'App');

      const filtered = filter([]);
      expect(filtered).toHaveLength(0);
    });
  });
});
