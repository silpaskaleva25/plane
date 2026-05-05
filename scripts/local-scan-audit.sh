#!/usr/bin/env bash

#####################################################################################################################################
#################################################       NPM AUDIT          ##########################################################
#####################################################################################################################################

echo "Local Scan: pnpm audit: Running pnpm audit..."
# uses pnpm command as this the project uses pnpm
pnpm audit 
NPM_AUDIT_RESULT=$?
echo "Local Scan: pnpm audit: Result: $NPM_AUDIT_RESULT"
if [ $NPM_AUDIT_RESULT -ne 0 ]; then
  echo "Local Scan: pnpm audit: ❌ Security vulnerabilities found."
  exit 1
fi
echo "Local Scan: pnpm audit: ✅ No vulnerabilities found."
exit 0
