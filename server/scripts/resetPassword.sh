#!/usr/bin/env bash
set -euo pipefail

# Generate a password reset link for a user, run from your local machine.
#
# Usage: ./resetPassword.sh <username-or-user-id>
#
# Looks the user up in the production database over ssh, inserts a reset
# code, and prints an email body to send to the user. Reset links expire
# after 24 hours.
#
# The database password is read from setProductionEnvVars.sh or
# .productionEnvVars in the project root (or a DB_PASSWORD env var).

SSH_HOST="steve@app-1"
PSQL="psql -d notepadcalculator -U notepadcalculator -h postgres-1 -X -q -A -t -v ON_ERROR_STOP=1"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <username-or-user-id>" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

DB_PASSWORD="${DB_PASSWORD:-}"
if [[ -z "$DB_PASSWORD" && -f "$ROOT/setProductionEnvVars.sh" ]]; then
  DB_PASSWORD=$(source "$ROOT/setProductionEnvVars.sh" && echo "$DB_PASSWORD")
fi
if [[ -z "$DB_PASSWORD" && -f "$ROOT/.productionEnvVars" ]]; then
  DB_PASSWORD=$(sed -n 's/^DB_PASSWORD=//p' "$ROOT/.productionEnvVars" | head -1)
fi
if [[ -z "$DB_PASSWORD" ]]; then
  echo "Could not find the production DB password. Set DB_PASSWORD, or make sure" >&2
  echo "setProductionEnvVars.sh or .productionEnvVars exists in the project root." >&2
  exit 1
fi

identifier="$1"
escaped="${identifier//\'/\'\'}"

# head reads a bounded amount up front: piping straight from /dev/urandom
# into `head -c 10` gets tr SIGPIPE-killed, which aborts under pipefail.
alnum=$(head -c 512 /dev/urandom | LC_ALL=C tr -dc 'A-Za-z0-9')
code=${alnum:0:10}
if [[ ${#code} -ne 10 ]]; then
  echo "Failed to generate a reset code" >&2
  exit 1
fi

# Look up the user and insert the reset code in one statement: the insert
# only happens when exactly one user matches.
sql="
with target as (
  select id, username from \"user\"
  where username = '$escaped' or id::text = '$escaped'
), ins as (
  insert into reset_password (code, user_id, creation_time)
  select '$code', id, now() from target
  where (select count(*) from target) = 1
  returning user_id
)
select id, username from target;
"

# The first line of stdin is the password (kept off the remote command
# line); the rest is the SQL for psql.
if ! result=$(printf '%s\n%s\n' "$DB_PASSWORD" "$sql" \
  | ssh "$SSH_HOST" "IFS= read -r PGPASSWORD; export PGPASSWORD; $PSQL"); then
  echo "ssh/psql failed (see error above), no reset code created." >&2
  exit 1
fi

if [[ -z "$result" ]]; then
  echo "No user found matching '$identifier'" >&2
  exit 1
fi

if [[ $(wc -l <<< "$result") -gt 1 ]]; then
  echo "Multiple users match '$identifier' (id|username), no reset code created:" >&2
  echo "$result" >&2
  echo "Re-run with the numeric user id." >&2
  exit 1
fi

user_id="${result%%|*}"
username="${result#*|}"

echo "Reset code created for user '$username' (id $user_id)."
echo
echo "Email body:"
echo "----------------------------------------------------------------------"
cat <<EOF
Hi,

Here's your password reset link for Notepad Calculator:

https://notepadcalculator.com/resetPassword/$code

It expires in 24 hours, so if it has stopped working just reply and I'll
send you a fresh one.

Steve
EOF
echo "----------------------------------------------------------------------"
