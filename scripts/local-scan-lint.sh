#!/usr/bin/env bash

#####################################################################################################################################
#################################################       NX LINT            ##########################################################
#####################################################################################################################################

echo "Local Scan: lint: Running nx lint checks..."

# Run lint across all projects
nx run-many -t lint
LINT_RESULT=$?

if [ $LINT_RESULT -ne 0 ]; then
  echo "❌ Local Scan: lint: Linting errors found."
  exit 1
fi

echo "✅ Local Scan: lint: No linting issues detected."
exit 0
