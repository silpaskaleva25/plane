import { RemovalPolicy } from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpAlbIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
import { APP_SECURITY_GROUP } from '../constants';
import { ApiBaseStackProps } from '../props/base-stack-props';
import { NameHelper } from '../utils/name-helper';
import { lookupVpcByEnv, subnetByEnvAndNameFilter } from '../utils/vpc-lookup';
import {
  ApiContainerConstruct,
  LoadBalancerProps,
  ServiceProps,
  TargetGroupProps,
  TaskDefinitionProps,
} from './api-container';
import { ApiGatewayConstruct, ApiGatewayConstructProps } from './api-gateway';

/**
 * Properties for ApiConstruct
 */
export interface ApiConstructProps extends ApiBaseStackProps {
  /**
   * ECR repository name
   * If not provided, defaults to `${envPrefix}-${projectName}-ecr` or `${projectName}-ecr` if envPrefix is empty
   * The repository will be created if it doesn't exist
   */
  repositoryName?: string;

  /**
   * Desired number of tasks to run
   * This is automatically calculated by deploy.js based on image detection:
   * - 0 if no 'latest' image exists (infrastructure-only)
   * - 1 if 'latest' image exists (sufficient for High Availability with cross-zone load balancing)
   * Can be overridden in serviceProps for manual scaling if needed
   * @default 0
   */
  desiredCount?: number;

  /**
   * Container port
   */
  containerPort: number;

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
   * Health check path (defaults to '/health')
   */
  healthCheckPath?: string;

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
   * Note: desiredCount will be set to 0 if imageTag is not provided, otherwise defaults to 1 (or the value you specify)
   */
  serviceProps?: ServiceProps;

  /**
   * Optional CDK props for the ECS Fargate Task Definition
   * These will be merged with the construct's default props
   */
  taskDefinitionProps?: TaskDefinitionProps;

  /**
   * Optional CDK props for the ECS Cluster
   * These will be merged with the construct's default props
   */
  clusterProps?: Omit<
    ecs.ClusterProps,
    'vpc' | 'clusterName' | 'containerInsights' | 'containerInsightsV2'
  >;

  /**
   * Optional CDK props for the API Gateway
   * If provided, an API Gateway will be created in front of the ALB
   */
  apiGatewayProps?: ApiGatewayConstructProps;
}

/**
 * API Construct
 *
 * This construct encapsulates the API infrastructure setup including:
 * - VPC lookup
 * - Security group lookup
 * - ECS Cluster creation
 * - ECR Repository creation (automatic)
 * - API Container deployment (uses custom ECR repository)
 */
export class ApiConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly cluster: ecs.Cluster;
  public readonly repository: ecr.Repository;
  public readonly apiContainer: ApiContainerConstruct;

  public constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const {
      envPrefix,
      projectName,
      vpcPrefix,
      repositoryName,
      desiredCount: baseDesiredCount,
      containerPort,
      cpu,
      memory,
      environment,
      healthCheckPath,
      loadBalancerProps,
      targetGroupProps,
      serviceProps,
      taskDefinitionProps,
      clusterProps,
      apiGatewayProps,
    } = props;

    // Create name helper for consistent resource naming
    const nameHelper = new NameHelper(projectName, envPrefix);

    // Lookup VPC by environment prefix
    const vpc = lookupVpcByEnv(this, id, vpcPrefix);
    this.vpc = vpc;

    // Lookup security groups
    const appSecGroup = SecurityGroup.fromLookupByName(
      this,
      `${id}AppSgLookup`,
      APP_SECURITY_GROUP,
      vpc
    );

    // Create ECS Cluster
    // In production, you might lookup an existing cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: nameHelper.name('api-cluster'),
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
      ...clusterProps,
    });
    this.cluster = cluster;

    // Create ECR Repository with security defaults
    // Repository creation is idempotent - redeploying the same stack won't error
    const finalRepositoryName = repositoryName || nameHelper.name('ecr');
    const repository = new ecr.Repository(this, 'StarterRepository', {
      repositoryName: finalRepositoryName,
      removalPolicy: RemovalPolicy.RETAIN, // Retain images on stack deletion for safety
      imageScanOnPush: true, // Enable vulnerability scanning
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
        },
      ],
    });
    this.repository = repository;

    // Always use 'latest' tag from ECR
    // Image must be built and pushed with 'latest' tag before deployment:
    //   nx run api-app:push:image (automatically runs tag:image and build:image via dependencies)
    const containerImage = ecs.ContainerImage.fromEcrRepository(
      repository,
      'latest'
    );

    // Use desiredCount from props if serviceProps.desiredCount is specified, otherwise use baseDesiredCount
    // This allows manual scaling override while respecting auto-detected value
    const desiredCount = serviceProps?.desiredCount ?? baseDesiredCount ?? 0;

    // Create API Container using the platform construct
    const apiContainer = new ApiContainerConstruct(this, 'StarterApiContainer', {
      serviceName: 'api', // envPrefix and projectName will be added by the construct
      repository,
      containerImage,
      vpc,
      cluster,
      containerPort,
      cpu,
      memory,
      environment,
      healthCheckPath,
      securityGroups: [appSecGroup], // ECS tasks in App tier
      albSecurityGroup: appSecGroup, // ALB uses App_sg only (has self-referencing rules for VPC Link)
      vpcSubnets: {
        subnetFilters: [
          {
            selectSubnets: subnetByEnvAndNameFilter(this, 'App'),
          },
        ],
      },
      envPrefix, // Pass environment prefix for multi-environment support
      projectName, // Pass project name for resource naming
      loadBalancerProps,
      targetGroupProps,
      serviceProps: {
        ...serviceProps,
        desiredCount,
      },
      taskDefinitionProps,
    });
    this.apiContainer = apiContainer;

    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      apiName: 'api-gateway',
      projectName,
      envPrefix,
      ...apiGatewayProps,
    });

    // Create VPC Link for HTTP API to connect to internal ALB
    // VPC Link placement: MUST be in Web tier (same as ALB) to avoid cross-tier routing issues
    // - Placing VPC Link and ALB in the same tier (Web) ensures direct connectivity
    // - Avoids potential Network ACL, routing table, or gateway complexities between tiers
    // - Security is enforced via App_sg (not tier isolation) which has self-referencing rules
    const vpcLink = new apigatewayv2.VpcLink(this, 'VpcLink', {
      vpc,
      vpcLinkName: nameHelper.name('api-vpclink'),
      securityGroups: [appSecGroup],
      subnets: {
        subnetFilters: [
          {
            selectSubnets: subnetByEnvAndNameFilter(this, 'Web'),
          },
        ],
      },
    });

    // Create custom ALB integration using HttpAlbIntegration
    // Architecture Flow & Tier Placement:
    // 1. API Gateway (HTTPS, edge) → terminates HTTPS at edge
    // 2. VPC Link (App_sg, Web tier) → connects to ALB in same tier
    // 3. ALB (App_sg, Web tier, HTTP) → receives requests from VPC Link
    // 4. ECS Tasks (App_sg, App tier, HTTP) → ALB routes across tiers to tasks
    //
    // Key Design Decisions:
    // - VPC Link + ALB both in Web tier: Simplifies routing, avoids cross-tier complexity
    // - All resources use App_sg: Self-referencing rules enable connectivity
    // - ECS in App tier: Defense-in-depth, isolates workloads from edge
    // - HTTP internally: Secure via VPC isolation, HTTPS already terminated at API Gateway
    const albIntegration = new HttpAlbIntegration(
      'AlbIntegration',
      apiContainer.listener,
      {
        vpcLink,
        // secureServerName not set - would enable HTTPS between VPC Link and ALB
        // Not needed since ALB listener is HTTP-only (HTTPS already terminated at API Gateway)
      }
    );

    // Add routes to the HTTP API
    apiGateway.api.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: albIntegration,
    });
  }
}
