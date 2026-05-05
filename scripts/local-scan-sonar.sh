#!/bin/bash

#####################################################################################################################################
#################################################       SONAR SCANNER      ##########################################################
#####################################################################################################################################

echo "Local Scan: sonar scan: Running Sonar Scan..."

# Load .env.local if present to set up the environment variables
if [ -f ".env.local" ]; then
  echo "Local Scan: sonar scan: Loading environment variables from .env.local ..."
  set -a
  source .env.local
  set +a
fi

# Make sure token and host are available  
if [ -z "$SONAR_TOKEN" ] || [ -z "$SONAR_HOST_URL" ]; then
  echo "❌ Local Scan: sonar scan: Missing SONAR_TOKEN or SONAR_HOST_URL. Scan cannot be completed. Please add missing SONAR_TOKEN or SONAR_HOST_URL."
  exit 1
fi

# Set SONAR_USER_HOME to avoid embedded Node.js issues
# Create directory if it doesn't exist
SONAR_USER_HOME="$HOME/.sonar"
mkdir -p "$SONAR_USER_HOME"
export SONAR_USER_HOME
echo "Local Scan: sonar scan: SONAR_USER_HOME: $SONAR_USER_HOME"

# Ensure we use host Node.js instead of embedded version
# This avoids deployment issues with embedded Node.js
if command -v node >/dev/null 2>&1; then
    # Get the actual Node.js executable path and ensure .exe extension on Windows
    NODE_EXECUTABLE=$(which node 2>/dev/null || command -v node 2>/dev/null)
    if [[ "$NODE_EXECUTABLE" != *.exe && "$OS" == "Windows_NT" ]]; then
        NODE_EXECUTABLE="${NODE_EXECUTABLE}.exe"
    fi
    # Convert to Windows path format if needed
    export SONAR_NODEJS_EXECUTABLE=$(cygpath -w "$NODE_EXECUTABLE" 2>/dev/null || echo "$NODE_EXECUTABLE")
    echo "Local Scan: sonar scan: Using host Node.js: $SONAR_NODEJS_EXECUTABLE"
    
    # Verify the file actually exists
    if [ ! -f "$SONAR_NODEJS_EXECUTABLE" ]; then
        echo "⚠️ Local Scan: sonar scan: Node.js executable not found at: $SONAR_NODEJS_EXECUTABLE"
        echo "Local Scan: sonar scan: Falling back to system detection..."
        export SONAR_NODEJS_EXECUTABLE=""
    fi
else
    echo "⚠️ Local Scan: sonar scan: Node.js not found in PATH"
    export SONAR_NODEJS_EXECUTABLE=""
fi


echo "Local Scan: sonar scan: Determining Sonar Project Key..."
# Determine project key from git repo name
SONAR_PROJECT_KEY=$(basename "$(git rev-parse --show-toplevel)")
echo "Local Scan: sonar scan: Using Sonar Project Key: $SONAR_PROJECT_KEY"

# Add this after the environment setup, before SonarScanner begin
echo "Local Scan: sonar scan: Discovering .NET projects..."
# Auto-discover all .csproj files in workspace
DOTNET_PROJECTS=$(find . -name "*.csproj" -not -path "./node_modules/*" -not -path "./dist/*" | sort)
echo "Local Scan: sonar scan: Found .NET projects:"
echo "Local Scan: sonar scan: $DOTNET_PROJECTS"

echo "Local Scan: sonar scan: Setting up temporary dotnet solution for SonarScanner..."
# Use workspace name for solution file name
SOLUTION_NAME="${SONAR_PROJECT_KEY}.sln"
SOLUTION_CREATED=false

if [ ! -f "$SOLUTION_NAME" ]; then
    echo "Local Scan: sonar scan: Creating solution: $SOLUTION_NAME"
    dotnet new sln -n "$SONAR_PROJECT_KEY"
    SOLUTION_CREATED=true
    
    # Add all discovered .NET projects to solution
    while IFS= read -r project; do
        if [ -n "$project" ]; then
            echo "Local Scan: sonar scan: Adding project to solution: $project"
            dotnet sln add "$project"
        fi
    done <<< "$DOTNET_PROJECTS"
fi

echo "Local Scan: sonar scan: Starting SonarScanner..."
# Some params for dotnet sonarscanner can only be set via command line, the others are set in the specified SonarQube.Analysis.xml file
dotnet sonarscanner begin -key:"$SONAR_PROJECT_KEY" \
  -d:sonar.projectBaseDir="$PWD" \
  -d:sonar.token="$SONAR_TOKEN" \
  -d:sonar.javascript.ignoreMissingNodeModules=true \
  -d:sonar.nodejs.executable="$SONAR_NODEJS_EXECUTABLE" \
  -s:"$PWD/SonarQube.Analysis.xml" || {
    echo "❌ Local Scan: sonar scan: SonarQube scan failed."
    exit 1
  }

echo "Local Scan: sonar scan: Building .NET projects for SonarScanner analysis..."
# Build all discovered .NET projects (excluding test projects for now)
while IFS= read -r project; do
    if [ -n "$project" ]; then
        # Skip test projects for main build (they'll be built during test phase)
        if [[ ! "$project" =~ \.Test\.csproj$ ]]; then
            echo "Local Scan: sonar scan: Building project: $project"
            dotnet build "$project"
        fi
    fi
done <<< "$DOTNET_PROJECTS"

echo "Local Scan: sonar scan: Building JS/TS projects..."
# Check if this is an Nx workspace and build frontend projects
if [ -f "nx.json" ]; then
    echo "Local Scan: sonar scan: Detected Nx workspace, building all JS/TS projects..."
    if command -v pnpm >/dev/null 2>&1; then
        # Build all projects except .NET projects (which are already built above)
        # Dynamically create exclusion list from discovered .NET projects
        EXCLUDE_PROJECTS=""
        if [ -n "$DOTNET_PROJECTS" ]; then
            # Extract project names from .csproj file paths and convert to Nx project names
            while IFS= read -r project; do
                if [ -n "$project" ]; then
                    # Extract directory name from .csproj path (e.g., ./apps/api/Project.csproj -> api)
                    PROJECT_DIR=$(dirname "$project")
                    PROJECT_NAME=$(basename "$PROJECT_DIR")
                    echo "Local Scan: sonar scan: Processing .NET project: $project (Dir: $PROJECT_DIR, Name: $PROJECT_NAME)"
                    # Map directory patterns to Nx project names dynamically
                    # Check if there's a project.json in the directory to get the actual Nx project name
                    if [ -f "$PROJECT_DIR/project.json" ]; then
                        # Extract the name from project.json if it exists
                        NX_PROJECT_NAME=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "$PROJECT_DIR/project.json" | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' 2>/dev/null)
                        echo "Local Scan: sonar scan: Found Nx project name: $NX_PROJECT_NAME"
                        if [ -z "$NX_PROJECT_NAME" ]; then
                            # Fallback: use directory name with common suffix patterns
                            case "$PROJECT_NAME" in
                                "api") NX_PROJECT_NAME="api-app" ;;
                                "api-test") NX_PROJECT_NAME="api-app-test" ;;
                                *) NX_PROJECT_NAME="$PROJECT_NAME" ;;
                            esac
                        fi
                        echo "Local Scan: sonar scan: Mapped .NET project $project to Nx project $NX_PROJECT_NAME"
                    else
                        echo "Local Scan: sonar scan: No project.json found for $project, using fallback mapping"
                        # Fallback: use directory name with common suffix patterns
                        case "$PROJECT_NAME" in
                            "api") NX_PROJECT_NAME="api-app" ;;
                            "api-test") NX_PROJECT_NAME="api-app-test" ;;
                            *) NX_PROJECT_NAME="$PROJECT_NAME" ;;
                        esac
                        echo "Local Scan: sonar scan: Mapped .NET project $project to Nx project $NX_PROJECT_NAME"
                    fi
                    
                    if [ -z "$EXCLUDE_PROJECTS" ]; then
                        EXCLUDE_PROJECTS="$NX_PROJECT_NAME"
                        echo "Local Scan: sonar scan: Initial exclusion list: $EXCLUDE_PROJECTS"
                    else
                        EXCLUDE_PROJECTS="$EXCLUDE_PROJECTS,$NX_PROJECT_NAME"
                        echo "Local Scan: sonar scan: Updated exclusion list: $EXCLUDE_PROJECTS"
                    fi
                fi
            done <<< "$DOTNET_PROJECTS"
        fi
        
        if [ -n "$EXCLUDE_PROJECTS" ]; then
            echo "Local Scan: sonar scan: Excluding .NET projects from Nx build: $EXCLUDE_PROJECTS"
            pnpm nx run-many -t build --exclude="$EXCLUDE_PROJECTS"
        else
            echo "Local Scan: sonar scan: No .NET projects to exclude, building all projects"
            pnpm nx run-many -t build
        fi
    else
        echo "❌ Local Scan: sonar scan: pnpm not found but is required for JS/TS build. Scan cannot proceed."
        exit 1
    fi
else
    echo "❌ Local Scan: sonar scan: No Nx workspace detected but one is expected. Scan cannot proceed."
    exit 1
fi

echo "Local Scan: sonar scan: Finalizing SonarScanner..."
dotnet sonarscanner end -d:sonar.token="$SONAR_TOKEN"

# Clean up temporary solution file if we created it
if [ "$SOLUTION_CREATED" = true ] && [ -f "$SOLUTION_NAME" ]; then
    echo "Local Scan: sonar scan: Cleaning up temporary solution file: $SOLUTION_NAME"
    rm "$SOLUTION_NAME"
fi

echo "✅ Local Scan: sonar scan: SonarQube scan completed. Checking Quality Gate status..."

# Wait for SonarQube to process the analysis result
sleep 2

# Locate report-task.txt
REPORT_FILE=$(find . -type f -name "report-task.txt" | head -n 1)
if [ ! -f "$REPORT_FILE" ]; then
  echo "❌ Local Scan: sonar scan: Could not find report-task.txt — scan failed."
  exit 1
fi

# Extract ceTaskId
CE_TASK_ID=$(grep -E '^ceTaskId=' "$REPORT_FILE" | cut -d'=' -f2)
if [ -z "$CE_TASK_ID" ]; then
  echo "❌ Local Scan: sonar scan: Could not extract ceTaskId — scan failed."
  exit 1
fi
echo "Local Scan: sonar scan: CE_TASK_ID=$CE_TASK_ID"

echo "⏳ Local Scan: sonar scan: Waiting for SonarQube background task to complete..."
ATTEMPTS=0
MAX_ATTEMPTS=30
SLEEP_INTERVAL=2

while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  echo " Local Scan: sonar scan: Checking status of SonarQube background task (Attempt $((ATTEMPTS + 1))/$MAX_ATTEMPTS)..."
  RESPONSE=$(curl -s -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/ce/task?id=$CE_TASK_ID")
  STATUS=$(echo "$RESPONSE" | grep -o '"status":"[^"]*"' | cut -d':' -f2 | tr -d '"')
  echo " Local Scan: sonar scan: Current status: $STATUS"


  if [ "$STATUS" = "SUCCESS" ]; then
    break
  elif [ "$STATUS" = "FAILED" ]; then
    echo "❌ Local Scan: sonar scan: SonarQube background task failed — scan failed."
    exit 1
  fi

  ATTEMPTS=$((ATTEMPTS + 1))
  printf "."
  sleep $SLEEP_INTERVAL
done

if [ "$STATUS" != "SUCCESS" ]; then
  echo "❌ Local Scan: sonar scan: Timed out waiting for SonarQube analysis to complete — scan failed."
  exit 1
fi

# Extract analysisId
ANALYSIS_ID=$(echo "$RESPONSE" | grep -o '"analysisId":"[^"]*"' | cut -d':' -f2 | tr -d '"')
if [ -z "$ANALYSIS_ID" ]; then
  echo "❌ Local Scan: sonar scan: Could not extract analysisId from Sonar response — scan failed."
  exit 1
fi
echo "Local Scan: sonar scan: ANALYSIS_ID=$ANALYSIS_ID"

# Retrieve Quality Gate result
QUALITY_RESPONSE=$(curl -s -u "$SONAR_TOKEN:" "$SONAR_HOST_URL/api/qualitygates/project_status?analysisId=$ANALYSIS_ID")
echo "Debug: Quality Gate Response: $QUALITY_RESPONSE"

# Extract the projectStatus.status field specifically
QUALITY_STATUS=$(echo "$QUALITY_RESPONSE" | sed -n 's/.*"projectStatus":{"status":"\([^"]*\)".*/\1/p')

if [ -z "$QUALITY_STATUS" ]; then
  echo "❌ Local Scan: sonar scan: Could not retrieve Quality Gate status — scan failed."
  exit 1
fi

echo "Local Scan: SonarQube Quality Gate status: $QUALITY_STATUS"

if [ "$QUALITY_STATUS" != "OK" ]; then
  echo "❌ Local Scan: sonar scan: Quality Gate failed. Issue exists in Sonar Scan."
  exit 1
fi

echo "✅ Local Scan: sonar scan:  Quality Gate passed. No issues found in Sonar Scan."
exit 0
