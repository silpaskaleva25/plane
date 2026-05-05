#!/usr/bin/env bash

#####################################################################################################################################
#################################################       NX FORMAT          ##########################################################
#####################################################################################################################################

echo "Local Scan: format:check: Running nx format:check..."

# Run format:check across all projects
nx format:check --base=main
FORMAT_RESULT=$?

if [ $FORMAT_RESULT -ne 0 ]; then
  echo "❌ Local Scan: format:check: Format errors found."
  exit 1
fi

echo "✅ Local Scan: format:check: No formatting issues detected."
exit 0
