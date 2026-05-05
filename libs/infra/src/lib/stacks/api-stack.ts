import { ApiConstruct, ApiConstructProps } from '@starter/infra-components';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id, props);
    // prettier-ignore
    new ApiConstruct(this, id, props); // NOSONAR Typescript:S1848 - Stack instantiation has side effects (registers with CDK app)
  }
}

