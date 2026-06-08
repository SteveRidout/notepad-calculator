if ! nc -z 127.0.0.1 5433; then
  echo "Postgres is not reachable at 127.0.0.1:5433."
  echo "Start the local database with: docker compose up postgres -d"
  exit 1
fi

node server/node_modules/.bin/multiexec \
  "cd server && NODE_ENV=development DB_PORT=5433 npx webpack -w" \
  "cd web && NODE_ENV=development npx webpack -w" \
  "cd server && NODE_ENV=development DB_PORT=5433 npx nodemon --enable-source-maps dist/serverBundle.js"
