#!/usr/bin/env sh

set -e

node --input-type=module <<'EOF'
import postgres from "postgres";

const databaseUrl = new URL(process.env.DATABASE_URL);
const databaseName = databaseUrl.pathname.slice(1);

if (!databaseName) {
  throw new Error("DATABASE_URL must include a database name");
}

const adminUrl = new URL(databaseUrl);
adminUrl.pathname = "/postgres";

const sql = postgres(adminUrl.toString(), { max: 1 });

try {
  const existingDatabase = await sql`
    SELECT 1 FROM pg_database WHERE datname = ${databaseName}
  `;

  if (existingDatabase.length === 0) {
    await sql.unsafe(`CREATE DATABASE "${databaseName.replaceAll('"', '""')}"`);
  }
} finally {
  await sql.end();
}
EOF

pnpm db:migrate
