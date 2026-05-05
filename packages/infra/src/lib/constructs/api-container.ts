import { Aspects, CfnOutput, Duration, Stack, Tags } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct, IConstruct } from 'constructs';
import { BaseStackProps } from '../props/base-stack-props';
import { NameHelper } from '../utils/name-helper';
import { subnetByEnvAndNameFilter } from '../utils/vpc-lookup';

/**
 * Optional CDK props for the Application Load Balancer
 * These will be merged with the construct's default props
 */
export type LoadBalancerProps = Omit<
  elbv2.ApplicationLoadBalancerProps,
  'vpc' | 'vpcSubnets' | 'loadBalancerName' | 'securityGroup'
>;

/**
 * Optional CDK props for the Application Target Group
 * These will be merged with the construct's default props
 */
export type TargetGroupProps = Omit<
  elbv2.ApplicationTargetGroupProps,
  'vpc' | 'port' | 'protocol' | 'targetType' | 'healthCheck'
>;

/**
 * Optional CDK props for the ECS Fargate Service
 * These will be merged with the construct's default props
 */
export type ServiceProps = Omit<
  ecs.FargateServiceProps,
  'cluster' | 'taskDefinition' | 'securityGroups' | 'serviceName' | 'vpcSubnets'
>;

/**
 * Optional CDK props for the ECS Fargate Task Definition
 * These will be merged with the construct's default props
 */
export type TaskDefinitionProps = Omit<
  ecs.FargateTaskDefinitionProps,
  'cpu' | 'memoryLimitMiB'
>;

/**
 * Properties for ApiContainerConstruct
 */
export interface ApiContainerConstructProps extends BaseStackProps {
  /**
   * The name of the service
   */
  serviceName: string;

  /**
   * The ECR repository containing the container image
   * Used to create a container image with 'latest' tag if containerImage is not provided
   * Note: Either this or containerImage must be provided
   */
  repository?: ecr.IRepository;

  /**
   * Container image to deploy
   * If provided, this takes precedence over repository
   * Typically created using ecs.ContainerImage.fromEcrRepository(repository, tag)
   * Note: Either this or repository must be provided
   */
  containerImage?: ecs.ContainerImage;

  /**
   * The VPC where the container will run
   */
  vpc: ec2.IVpc;

  /**
   * The cluster where the container will run
   */
  cluster: ecs.ICluster;

  /**
   * Container port (defaults to 5000)
   */
  containerPort?: number;

  /**
   * CPU units (defaults to 256)
   */
  cpu?: number;

  /**
   * Memory in MB (defaults to 512)
   */
  memory?: number;

  /**
   * Environment variables for the container
   */
  environment?: { [key: string]: string };

  /**
   * Optional application load balancer (if not provided, one will be created)
   */
  loadBalancer?: elbv2.IApplicationLoadBalancer;

  /**
   * Health check path (defaults to '/health')
   */
  healthCheckPath?: string;

  /**
   * Security groups for the ECS service (required for security)
   */
  securityGroups: ec2.ISecurityGroup[];

  /**
   * Security group for the Application Load Balancer
   * Note: Only use App_sg - Web_sg doesn't allow traffic from App_sg and causes intermittent failures
   * - App_sg: Has self-referencing rules for VPC Link connectivity (required)
   */
  albSecurityGroup?: ec2.ISecurityGroup;

  /**
   * VPC subnets for the ECS service (optional, defaults to CDK-selected subnets)
   */
  vpcSubnets?: ec2.SubnetSelection;

  /**
   * Optional CDK props for the Application Load Balancer
   * These will be merged with the construct's default props
   */
  loadBalancerProps?: LoadBalancerProps;

  /**
   * Optional CDK props for the Application Target Group
   * These will be merged with the construct's default props
   */
  targetGroupProps?: TargetGroupProps;

  /**
   * Optional CDK props for the ECS Fargate Service
   * These will be merged with the construct's default props
   * Note: desiredCount defaults to 0 but can be overridden via serviceProps
   */
  serviceProps?: ServiceProps;

  /**
   * Optional CDK props for the ECS Fargate Task Definition
   * These will be merged with the construct's default props
   */
  taskDefinitionProps?: TaskDefinitionProps;
}

/**
 * A construct that creates an ECS Fargate service for running API containers
 *
 * This construct provides a standardized way to deploy containerized APIs
 * on AWS ECS Fargate with an Application Load Balancer.
 *
 * Architecture & Tier Placement:
 * - ALB: Deployed in Web tier subnets (for VPC Link connectivity)
 * - ECS Tasks: Deployed in App tier subnets (for workload isolation)
 * - All resources use App_sg security group (has self-referencing rules)
 *
 * Key Design Decisions:
 * - ALB in Web tier: Must match VPC Link placement to avoid cross-tier routing complexity
 * - App_sg for all: Self-referencing rules enable connectivity (VPC Link → ALB → ECS)
 * - Web_sg NOT used: Lacks rules to allow traffic from App_sg (causes 503 errors)
 * - HTTP only: HTTPS terminated at API Gateway, internal traffic uses HTTP (secure via VPC isolation)
 * - Security group aspects: Removes SecurityGroupIngress resources to avoid SCP permission conflicts
 *
 * @example
 * ```typescript
 * const apiContainer = new ApiContainerConstruct(this, 'MyApiContainer', {
 *   serviceName: 'my-api-service',
 *   repository: myEcrRepo,
 *   vpc: myVpc,
 *   cluster: myCluster,
 *   securityGroups: [appSecurityGroup], // Required: security groups for the ECS service
 *   albSecurityGroup: appSecurityGroup, // Required: App_sg only (has self-referencing for VPC Link)
 *   envPrefix: 'dev', // Environment prefix for multi-environment support
 *   containerPort: 8080,
 *   // Note: Service is created with desiredCount: 0 - Deployment process will handle all deployments
 *   // The image tag in the task definition uses 'latest' - Deployment process will update it during deployment
 * });
 * ```
 */
export class ApiContainerConstruct extends Construct {
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;
  public readonly listener: elbv2.IApplicationListener;

  constructor(scope: Construct, id: string, props: ApiContainerConstructProps) {
    super(scope, id);

    const {
      serviceName,
      repository,
      containerImage,
      vpc,
      cluster,
      containerPort = 5000,
      cpu = 256,
      memory = 512,
      healthCheckPath = '/health',
      securityGroups,
      albSecurityGroup,
      vpcSubnets,
      envPrefix = '',
      projectName,
      targetGroupProps,
      serviceProps,
      taskDefinitionProps,
    } = props;

    // Use provided containerImage or fall back to repository-based image.
    // Note: ecs.ContainerImage.fromEcrRepository(repository, 'latest') always returns a valid reference,
    // even if the image does not exist in ECR yet. This is safe for first-time deploys:
    // - CDK/CloudFormation only needs the repository and tag reference at deploy time.
    // - ECS will only fail at runtime (when starting a task) if the image is missing.
    // - This allows infrastructure to be deployed before any images are pushed.
    const finalContainerImage =
      containerImage ||
      (repository
        ? ecs.ContainerImage.fromEcrRepository(repository, 'latest')
        : undefined);

    if (!finalContainerImage) {
      throw new Error('Either containerImage or repository must be provided');
    }

    // Build resource names with environment prefix and project name
    const nameHelper = new NameHelper(projectName, envPrefix);
    const prefixedServiceName = nameHelper.name(serviceName);

    // Create Application Load Balancer (internal, HTTP only)
    // ALB Placement: Web tier subnets (must match VPC Link tier for direct connectivity)
    // Security: App_sg (self-referencing rules enable VPC Link → ALB → ECS traffic flow)
    // See class documentation for complete architecture details

    this.loadBalancer =
      props.loadBalancer ??
      new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancerV2', {
        vpc,
        internetFacing: false,
        loadBalancerName: nameHelper.name('alb'),
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetFilters: [
            {
              selectSubnets: subnetByEnvAndNameFilter(this, 'Web'),
            },
          ],
        },
        ...props.loadBalancerProps,
      });

    // Create target group for ALB
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        enabled: true,
        protocol: elbv2.Protocol.HTTP,
        path: healthCheckPath,
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: Duration.seconds(30),
      ...targetGroupProps,
    });

    // Create listener for ALB (HTTP only, no TLS)
    this.listener = this.loadBalancer.addListener('Listener', {
      port: containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup],
    });

    // Create task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        cpu,
        memoryLimitMiB: memory,
        ...taskDefinitionProps,
      }
    );

    // Add minimal container definition - required for CloudFormation to create valid task definition
    // Container image should be built and pushed to ECR before deployment
    // The image is pulled from ECR when tasks start
    // Deployment process will create new task definition revisions with updated images as needed
    // Port mappings are needed for the load balancer target group to route traffic
    const container = this.taskDefinition.addContainer('ApiContainer', {
      image: finalContainerImage,
      environment: props.environment,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
      }),
    });

    container.addPortMappings({
      containerPort,
      protocol: ecs.Protocol.TCP,
    });

    // Important: CloudFormation will create the initial task definition with placeholder image
    // The deployment process will create new task definition revisions with actual images
    // The ECS service references a specific revision - The deployment process must update the service
    // to use new revisions, not rely on CloudFormation to manage the task definition
    //
    // Note: If CloudFormation stack is updated, it may create a new task definition revision
    // with the placeholder image. The deployment process should always update the service to use
    // the latest deployment-created revision, not the CloudFormation-managed one.

    // Create Fargate service
    this.service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition: this.taskDefinition,
      desiredCount: serviceProps?.desiredCount ?? 0, // Default to 0, can be overridden
      securityGroups,
      serviceName: prefixedServiceName,
      vpcSubnets,
      ...serviceProps,
    });

    // Add tags for resource identification
    Tags.of(this.service).add('ManagedBy', 'StarterPlatform');
    Tags.of(this.taskDefinition).add('ManagedBy', 'StarterPlatform');
    if (envPrefix) {
      Tags.of(this.service).add('Environment', envPrefix);
      Tags.of(this.taskDefinition).add('Environment', envPrefix);
    }

    this.targetGroup.addTarget(this.service);

    // When using looked-up security groups, CDK will try to create SecurityGroupIngress resources
    // which require ec2:AuthorizeSecurityGroupIngress permission (often denied by SCPs).
    // The security group rules must be pre-configured in AWS outside of CDK.
    // We use an Aspect to visit all constructs and remove SecurityGroupIngress for looked-up SGs.
    const stack = Stack.of(this);
    Aspects.of(stack).add({
      visit(node: IConstruct) {
        if (
          node instanceof ec2.CfnSecurityGroupIngress ||
          node instanceof ec2.CfnSecurityGroupEgress
        ) {
          const groupId = node.groupId;

          // If the groupId is a string starting with 'sg-', it's a looked-up security group
          // (CloudFormation references would be objects, not strings)
          if (typeof groupId === 'string' && groupId.startsWith('sg-')) {
            // Remove this resource from the construct tree to prevent CloudFormation from creating it
            // The security group rules must be pre-configured in AWS
            const parent = node.node.scope;
            if (parent) {
              // Try to remove from parent
              const removed = parent.node.tryRemoveChild(node.node.id);
              // If that doesn't work, try removing from the stack directly
              if (!removed) {
                stack.node.tryRemoveChild(node.node.id);
              }
            }
          }
        }
      },
    });

    const { loadBalancerDnsName } = this.loadBalancer;
    const { serviceName: ecsServiceName } = this.service;

    // Add outputs with environment-prefixed export names
    // Include construct ID to ensure uniqueness when multiple instances exist in the same stack
    const constructId = this.node.id;
    const dnsExportName = nameHelper.name(`${serviceName}-${constructId}-dns`);
    new CfnOutput(this, 'LoadBalancerDns', {
      value: loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
      exportName: dnsExportName,
    });

    const urlExportName = nameHelper.name(`${serviceName}-${constructId}-url`);
    new CfnOutput(this, 'LoadBalancerUrl', {
      value: `http://${loadBalancerDnsName}`,
      description: 'Load Balancer URL',
      exportName: urlExportName,
    });

    const serviceNameExportName = nameHelper.name(
      `${serviceName}-${constructId}-service-name`
    );
    new CfnOutput(this, 'ServiceName', {
      value: ecsServiceName,
      description: 'ECS Service Name',
      exportName: serviceNameExportName,
    });
  }
}

