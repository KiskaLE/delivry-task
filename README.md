# Delivry Task

A web application for managing shipments and invoices. The project is built with Next.js, React, tRPC, Drizzle ORM, and PostgreSQL.

## Tech Stack

- Next.js 15
- React 19
- tRPC 11
- Drizzle ORM
- PostgreSQL
- Tailwind CSS
- pnpm
- Docker / Docker Compose

## Requirements

For local development:

- Node.js 22
- pnpm 10
- Docker or Podman for the local PostgreSQL database

For Docker deployment:

- Docker
- Docker Compose

## Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Minimal local development configuration:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/delivry-task"
```

Optional variables for Docker Compose deployment:

```env
POSTGRES_PASSWORD="change-me"
POSTGRES_PORT="5432"
APP_PORT="3000"
```

`DATABASE_URL` is required by the application and database migrations. In the Docker Compose deployment, it is built automatically from `POSTGRES_PASSWORD` and the internal `postgres` hostname.

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the local database:

```bash
./start-database.sh
```

Run migrations:

```bash
pnpm db:migrate
```

Start the development server:

```bash
pnpm dev
```

The application will be available at:

```text
http://localhost:3000
```

## Deployment With Docker Compose

The project includes a production `Dockerfile` and a compose configuration in [docker/docker-compose.yaml](docker/docker-compose.yaml).

Prepare a `.env` file on the server. Recommended minimal production configuration:

```env
POSTGRES_PASSWORD="strong-production-password"
POSTGRES_PORT="5432"
APP_PORT="3000"
```

Start the deployment:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml up -d --build
```

Compose starts three services:

- `postgres` - PostgreSQL database with the persistent `postgres18_data` volume
- `migrator` - one-off container that creates the database if it does not exist and runs `pnpm db:migrate`
- `app` - production Next.js application exposed on `APP_PORT`

Check service status:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml ps
```

Application logs:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml logs -f app
```

Migration logs:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml logs migrator
```

Stop the deployment:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml down
```

Stop the deployment and remove the database volume:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml down -v
```

Use this only if you really want to delete the data.

## Updating Production

Pull the new code version on the server and run:

```bash
docker compose --env-file .env -f docker/docker-compose.yaml up -d --build
```

On startup, the `migrator` runs again and applies new Drizzle migrations. The application container waits until the database is healthy and migrations complete successfully.
