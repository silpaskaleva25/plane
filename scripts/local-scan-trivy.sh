#!/usr/bin/env bash

#####################################################################################################################################
#################################################       TRIVY              ##########################################################
#####################################################################################################################################

echo "Local Scan: trivy: Running trivy ..."
trivy fs . \
  --skip-files="pnpm-lock.yaml,package-lock.json,yarn.lock" \
  --skip-dirs="node_modules,.nx,dist,coverage,.angular,.sonarqube,.verdaccio,tmp,.git" 
TRIVY_RESULT=$?

if [ $TRIVY_RESULT -ne 0 ]; then
    echo "❌ Local Scan: trivy: Trivy found vulnerabilities."
    exit 1
fi

echo "✅ Local Scan: trivy: Trivy found no vulnerabilities."
exit 0
