# Advanced Readme

These notes are primarily for myself, Steve. If you just want to run notepadcalculator locally in the simplest way, see the main README.md file.

# How to set up a local dev environment without Docker

Prerequisites:

- NodeJS 20
- Postgres 12 server running

## Create DB locally

```sh
createuser notepadcalculator -U postgres
createdb notepadcalculator -U postgres
psql -d notepadcalculator -U postgres

# Within the psql prompt:
GRANT ALL PRIVILEGES ON DATABASE notepadcalculator TO notepadcalculator;
```

## Run server

```sh
(cd server && npm install)
(cd web && npm install)
./dev.sh
```

# Set up production environment

NOTE: I wrote these notes for myself. I don't support or recommend following this except as a rough guide for someone who already knows what they are doing.

## Create DB on server

```sh
ssh steve@app-1

createuser notepadcalculator -h postgres-1 -U postgres
createdb notepadcalculator -h postgres-1 -U postgres
psql -d notepadcalculator -h postgres-1 -U postgres

# Replace XXX_new_password with new password as appropriate:
ALTER USER notepadcalculator WITH PASSWORD 'XXX_new_password';

# XXX this seems excessive, may not be necessary!
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO notepadcalculator;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO notepadcalculator;

# Make notepadcalculator user the owner
ALTER DATABASE notepadcalculator OWNER TO notepadcalculator;

# Exit psql
\q

psql -d notepadcalculator -h postgres-1 -U notepadcalculator
```

## Security secrets

Create a file `setProductionEnvVars.sh` which looks like this, but with appropriate values for
DB_HOST and DB_PASSWORD:

```sh
export DB_NAME='notepadcalculator'
export DB_HOST='0.0.0.0'
export DB_PASSWORD='XXXXXXXXXXX'
export DB_USER='notepadcalculator'
```

## Run initial DB migration on server

```sh
# Need to do from app server due to DB firewall rules
ssh steve@app-1

# First time only
cd ~/code
git clone https://github.com/SteveRidout/notepad-calculator-3.git

cd ~/code/notepadcalculator-3
git pull
cd server
npm install
npx knex migrate:latest --env production
```

## Preparing to deploy for first time

This only needs doing before the first deploy:

```sh
ssh steve@app-1

# Create the directory and set owner
cd /var/www
sudo mkdir notepadcalculator2
sudo chown steve notepadcalculator2

# Create empty config files and set owner
sudo touch /lib/systemd/system/notepadcalculator2.service
sudo chown steve /lib/systemd/system/notepadcalculator2.service

sudo touch /etc/nginx/sites-enabled/notepadcalculator2.conf
sudo chown steve /etc/nginx/sites-enabled/notepadcalculator2.conf
```

## Deploy instructions

```sh
./deploy.sh

# If config has changed
cd config
./copyToAppServer.sh

ssh steve@app-1

# Run npm install
cd /var/www/notepadcalculator2/server
npm install

sudo systemctl restart notepadcalculator2.service
```

# Migrations

## Creating DB migrations

```sh
cd server
npx knex migrate:make migration_name
```

## Running DB migrations

Needs to be done locally and in production

```sh
cd server
npm install
npx knex migrate:latest
```

## Style issues

Postgres/knex: always use `text` columns instead of `string`/`varchar`.

# Analytics

```sql
-- Daily new users
select date(creation_time), count(*) from "user" group by date(creation_time) order by date(creation_time);

-- Weekly new users
select date_trunc('week', creation_time) as weekly, count(*) from "user" group by weekly order by weekly;

-- Weekly new notes
select date_trunc('week', creation_time) as weekly, count(*) from note group by weekly order by weekly;

-- Last modified notes (misleading since we lose old modifications when user modifies again)
select date(last_modified_time), count(*) from note group by date(last_modified_time) order by date(last_modified_time);
```

```sh
# Check access logs
sudo sh -c '(zcat /var/log/nginx/access.log.[2-5].gz; cat /var/log/nginx/access.log.1 /var/log/nginx/access.log) | grep https://notepadcalculator.com | goaccess --log-format=COMBINED --ignore-crawlers'
```

# Reset password instructions

For now this involves me since we don't have user email addresses.

If someone emails, here's the response:

```
Please let me know your username and the title of one or two of your notes and I can generate a password reset link for you.
```

Here's how to generate a reset link

```sh
ssh steve@app-1
cd code/notepad-calculator-3/server/scripts
./connectToProduction.sh

# Search for their username
select * from "user" where username = 'their username';

# Generate random code
npx ts-node randomCode.ts

# When in psql, replace values as appropriate.
insert into reset_password (code, user_id) values ('xxxxxxx', $USER_ID);
```

Their reset URL will then be `https://notepadcalculator.com/resetPassword/xxxxxxx`

sudo cat /var/log/nginx/access.log.1 /var/log/nginx/access.log | grep https://notepadcalculator.com | goaccess --log-format=COMBINED --ignore-crawlers
