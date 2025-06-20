node server/node_modules/.bin/multiexec \
  "cd server && npx webpack -w" \
  "cd web && npx webpack -w" \
  "cd server && npx nodemon --enable-source-maps dist/serverBundle.js"