#!/bin/bash

# This script builds and deploys to the production server

source setProductionEnvVars.sh

cd server
NODE_ENV=production npx webpack
cd ../web
NODE_ENV=production npx webpack
cd ..

rsync -r --delete server/dist steve@app-1:/var/www/notepadcalculator2/server
rsync -r --delete server/package.json steve@app-1:/var/www/notepadcalculator2/server
rsync -r --delete server/package-lock.json steve@app-1:/var/www/notepadcalculator2/server
rsync -r --delete web/dist steve@app-1:/var/www/notepadcalculator2/web
scp .node-version steve@app-1:/var/www/notepadcalculator2/.node-version

echo ""
echo "Manually run npm install and update notepadcalculator2.service if necessary"
