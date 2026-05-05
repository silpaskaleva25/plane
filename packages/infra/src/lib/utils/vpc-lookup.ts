import { ISubnet, IVpc, Vpc } from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

const AVAILABILITY_ZONES = [`aza`, `azb`];
const SUBNET_PARAM_NAME_PREFIX = '/PBMMAccel/network/vpc/1/net/';

function lookupSubnetIds(
  scope: Construct,
  namePrefix: 'App' | 'Data' | 'Web'
): string[] {
  const subnetIndices = {
    Web: 1,
    App: 2,
    Data: 3,
  };
  const subnetIndex = subnetIndices[namePrefix];
  const paramPrefix = `${SUBNET_PARAM_NAME_PREFIX}${subnetIndex}`;

  const subnetIds: string[] = [];

  for (const az of AVAILABILITY_ZONES) {
    const paramName = `${paramPrefix}/${az}/id`;
    const subnetId = StringParameter.valueFromLookup(scope, paramName);

    subnetIds.push(subnetId);
  }

  return subnetIds;
}

export function lookupVpcByEnv(
  scope: Construct,
  id: string,
  vpcPrefix: string
): IVpc {
  const vpcNameTag = `${vpcPrefix}_vpc`;
  return Vpc.fromLookup(scope, `${id}_Vpc_Lookup`, {
    tags: { Name: vpcNameTag },
  });
}

export function subnetByEnvAndNameFilter(
  scope: Construct,
  namePrefix: 'App' | 'Data' | 'Web'
): (subnets: ISubnet[]) => ISubnet[] {
  const subnetIds = lookupSubnetIds(scope, namePrefix);

  return (subnets: ISubnet[]) => {
    return subnets.filter((sn) => subnetIds?.includes(sn.subnetId));
  };
}
