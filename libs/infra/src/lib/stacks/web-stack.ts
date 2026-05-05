import { BaseStackProps, WebConstruct } from '@starter/infra-components';
import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class WebStack extends Stack {
  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);
    // prettier-ignore
    new WebConstruct(this, id, { ...props }); // NOSONAR Typescript:S1848 - Stack instantiation has side effects (registers with CDK app)
  }
}

