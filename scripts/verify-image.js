#!/usr/bin/env node
const { execAwsCli } = require('./shell-utils');
const { getEcrConfig, ecrExists } = require('./ecr-helper');

/**
 * Verify that the 'latest' image exists in ECR
 *
 * Exit codes:
 * - 0: Success (image exists or first-time deploy without ECR)
 * - 1: Failure (ECR exists but no 'latest' image found)
 *
 * Outputs JSON to stdout: {"imageExists": true/false, "imageTag": "latest"}
 */

function reportImageNotFound(repoName, imageTag) {
  console.error(`❌ Image '${imageTag}' not found in repository '${repoName}'`);
  console.error(`   Build and push the image first:\n`);
  console.error(`   nx run api-app:push:image\n`);
  console.error(
    `   Deployment will proceed with desiredCount=0 (no running tasks)\n`
  );
  console.log(JSON.stringify({ imageExists: false, imageTag }));
  process.exit(0);
}

try {
  const config = getEcrConfig();
  const imageTag = 'latest'; // Always use 'latest'

  console.log(`🔍 Verifying '${imageTag}' image exists in ECR...`);
  console.log(`   Repository: ${config.repoName}`);
  console.log(`   Region:     ${config.region}\n`);

  // Check if ECR repository exists
  if (!ecrExists(config.repoName, config.region)) {
    // First-time deploy: ECR doesn't exist yet, CDK will create it
    console.log(`ℹ️  ECR repository '${config.repoName}' does not exist yet`);
    console.log(`   This is expected for first-time deployment`);
    console.log(
      `   CDK will create the repository with desiredCount=0 (no running tasks)`
    );
    console.log(
      `   After pushing '${imageTag}' image, redeploy to start tasks\n`
    );

    // Output JSON for deploy script
    console.log(JSON.stringify({ imageExists: false, imageTag }));
    process.exit(0);
  }

  // Check if image tag exists
  try {
    const result = execAwsCli([
      'ecr',
      'describe-images',
      '--repository-name',
      config.repoName,
      '--region',
      config.region,
      '--image-ids',
      `imageTag=${imageTag}`,
    ]);

    const images = JSON.parse(result);

    if (images.imageDetails && images.imageDetails.length > 0) {
      const imageDetail = images.imageDetails[0];
      const sizeInMB = (imageDetail.imageSizeInBytes / 1024 / 1024).toFixed(2);
      const pushedAt = new Date(imageDetail.imagePushedAt).toLocaleString();

      console.log(`✅ Image '${imageTag}' found!`);
      console.log(`   Size:       ${sizeInMB} MB`);
      console.log(`   Pushed At:  ${pushedAt}`);
      console.log(`   Digest:     ${imageDetail.imageDigest}`);
      console.log(`\n✅ Deployment will start tasks (desiredCount=1)\n`);

      // Output JSON for deploy script
      console.log(JSON.stringify({ imageExists: true, imageTag }));
      process.exit(0);
    }

    // No image tag found
    reportImageNotFound(config.repoName, imageTag);
  } catch (error) {
    // Image not found
    if (error.message.includes('ImageNotFoundException')) {
      reportImageNotFound(config.repoName, imageTag);
    }

    // Other AWS CLI error
    throw error;
  }
} catch (error) {
  console.error(`❌ Error verifying image:`);
  console.error(`   ${error.message}\n`);
  process.exit(1);
}
