# Developer Setup Guide

## TL;DR

### AWS CLI & Credentials

- Follow the play about [Using AWS](https://internal-wiki.atlassian.net/wiki/spaces/STARTER/pages/4100981183/Using+AWS)

### Podman

- Download and install [Podman Desktop](https://podman-desktop.io/downloads) including Podman runtime
- Read more about [How to run a containerized Nx .Net Application with Podman](https://internal-wiki.atlassian.net/wiki/spaces/STARTER/pages/4233953281/How+to+run+a+containerized+Nx+.Net+Application+with+Podman)

### Local Environment Variables

- Make sure you have a local `.env.local` file in the root of this project, with:

```bash
# Local SonarQube server URL
SONAR_HOST_URL=http://localhost:9000
# Your SonarQube user token
SONAR_TOKEN=<your-sonar-token>

# CDK Deployment Configuration
ENV_PREFIX='philippe'   # developer name as distinguishable environment prefix
PROJECT_NAME='starter'    # application stack name, e.g.: Starter Platform Starter App
VPC_PREFIX='Dev'        # VPC AWS environment
AWS_PROFILE='starter-dev'   # developer AWS profile (bounded to an AWS account and region)

# Using Podman locally instead of default Docker
DOCKER_HOST='npipe:////./pipe/podman-machine-default'
DOCKER_BUILDKIT=0
```

For general developer setup instructions, see the [Developer Setup Playbook](https://internal-wiki.atlassian.net/wiki/spaces/STARTER/pages/4107206689/Starter+Starter+Digital+Architect+and+Developer+Getting+Started+Guide)


