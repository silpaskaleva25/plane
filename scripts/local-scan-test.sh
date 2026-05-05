#!/usr/bin/env bash

#####################################################################################################################################
#################################################       NX TEST            ##########################################################
#####################################################################################################################################

echo "Local Scan: test: Running nx test checks..."

# Run nx test across all projects
nx run-many -t test
TEST_RESULT=$?

if [ $TEST_RESULT -ne 0 ]; then
  echo "❌ Local Scan: test: Test errors found."
  exit 1
fi

echo "✅ Local Scan: test: No test errors detected."
exit 0
