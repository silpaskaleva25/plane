#!/usr/bin/env bash

#####################################################################################################################################
#################################################       ALL SCANS          ##########################################################
#####################################################################################################################################

echo "Local Scan: Starting all local code scanning ..."

# Function to run a scan and handle errors
run_scan() {
    local script_name=$1
    local scan_name=$2
    
    echo "Local Scan: Calling $scan_name..."
    ./scripts/$script_name.sh
    local exit_code=$?
    
    if [ $exit_code -ne 0 ]; then
        echo "❌ Local Scan: Full scan exited due to $scan_name failure. Resolve issues and rerun the scan."
        echo "Individual scans can be run via their respective npm scripts. Use 'pnpm <script-name>' to run them individually. To rerun this failed scan use:"
        echo  "pnpm $script_name"
        exit $exit_code
    fi    
}

# Call each scan and exit on first failure
run_scan "local-scan-audit" "NPM Security Audit"
run_scan "local-scan-format" "Code Formatting Check"
run_scan "local-scan-lint" "Code Linting Check"
run_scan "local-scan-test" "Unit Tests"
run_scan "local-scan-trivy" "Trivy Vulnerability Scan"
run_scan "local-scan-sonar" "SonarQube Analysis"

echo "🎉 Local Scan: All local code scanning completed successfully!"
exit 0

