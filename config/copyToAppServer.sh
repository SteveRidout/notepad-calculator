#!/bin/bash

# Check if .productionEnvVars file exists
if [ ! -f "../.productionEnvVars" ]; then
    echo "ERROR: Missing .productionEnvVars file"
    echo ""
    echo "Please create the file '.productionEnvVars' in the project root with the following format:"
    echo ""
    echo "  DB_NAME=your_database_name"
    echo "  DB_HOST=your_database_host"
    echo "  DB_PASSWORD=your_database_password"
    echo "  DB_USER=your_database_user"
    echo ""
    echo "At minimum, DB_HOST and DB_PASSWORD must be provided."
    exit 1
fi

# Create a temporary copy of the service file
TMP_SERVICE_FILE="/tmp/notepadcalculator2.service.tmp"
cp notepadCalculator2.service "$TMP_SERVICE_FILE"

# Read environment variables from .productionEnvVars and inject them into the service file
ENV_LINES=""
while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    
    # Trim whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    if [ -n "$key" ] && [ -n "$value" ]; then
        if [ -n "$ENV_LINES" ]; then
            ENV_LINES="${ENV_LINES}\n"
        fi
        ENV_LINES="${ENV_LINES}Environment=\"${key}=${value}\""
    fi
done < "../.productionEnvVars"

# Inject the environment variables after the [Service] line
if [ -n "$ENV_LINES" ]; then
    # Use awk to inject after [Service] line
    awk -v env_vars="$ENV_LINES" '
        /^\[Service\]$/ {
            print
            gsub(/\\n/, "\n", env_vars)
            printf "%s\n", env_vars
            next
        }
        {print}
    ' "$TMP_SERVICE_FILE" > "${TMP_SERVICE_FILE}.new"
    mv "${TMP_SERVICE_FILE}.new" "$TMP_SERVICE_FILE"
fi

# Copy the modified service file to the server
scp "$TMP_SERVICE_FILE" steve@app-1:/lib/systemd/system/notepadcalculator2.service

# Clean up the temporary file
rm "$TMP_SERVICE_FILE"

# Copy nginx config as before
scp notepadCalculator2-nginx.conf steve@app-1:/etc/nginx/sites-enabled/notepadcalculator2.conf

echo "Remember to restart nginx and notepadcalculator2 services on the server:"
echo ""
echo "ssh steve@app-1"
echo "sudo systemctl daemon-reload"
echo "sudo systemctl restart nginx"
echo "sudo systemctl restart notepadcalculator2"