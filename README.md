# FleetCore Maintenance API

A modular NestJS REST API for managing fleet vehicles, mechanics, workshops, maintenance scheduling, maintenance state transitions, audit events, and partner history lookups. The backend uses TypeScript, PostgreSQL, TypeORM, bcrypt, JWT, class-validator, and Swagger/OpenAPI.

## Project owner

- **Coder:** [José Acevedo]
- **Clan:** [Magdalena (Node/Nest AM)]

## Technology and architecture

- **NestJS modules:** authentication, users, vehicles, mechanics, workshops, maintenances, audits, external integrations, and database seeding.
- **Layering:** controllers → services → DAOs → TypeORM entities. Business services never import TypeORM; ORM queries and transactions are implemented inside DAOs. Entity files define persistence mapping and both sides of entity relationships.
- **Security:** bcrypt password hashing, JWT bearer tokens, NestJS guards, role metadata, and a dedicated `x-api-key` guard for the external history endpoint.
- **Validation:** global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and transformation enabled; DTOs use `class-validator` and `class-transformer`.
- **Responses:** a global interceptor wraps every successful response; a custom exception filter normalizes errors and maps PostgreSQL uniqueness and foreign-key conflicts to non-500 HTTP statuses.
- **Persistence:** PostgreSQL with TypeORM entity synchronization configured by `DB_SYNCHRONIZE`. It is enabled by default for this assessment. For production, use reviewed migrations and set it to `false`.

## Requirements

- Docker Engine and Docker Compose plugin for the containerized workflow.
- Or Node.js 20+, npm, and a PostgreSQL instance for a native development workflow.

## Run with Docker (recommended)

1. Create the environment file:

   ```bash
   cp .env.example .env
   ```

2. Start the API and PostgreSQL. The PostgreSQL service is reachable from the API over the private Compose network and stores data in a named volume.

   ```bash
   docker compose up --build -d
   docker compose ps
   ```

3. Populate the database with the idempotent seeder:

   ```bash
   docker compose exec api npm run seed
   ```

4. Swagger UI at **http://localhost:3000/docs**.

Useful commands:

```bash
docker compose logs -f api
docker compose logs -f postgres
docker compose down
# Stop containers without deleting database data:
docker compose down
# Remove containers and the persisted database volume (destructive):
docker compose down -v
```

The `.env` file is deliberately excluded from the Docker build context. Compose loads it at runtime. Do not commit a real `.env` file or use the demonstration secrets in a public deployment.

## Run locally without a containerized API

Run a PostgreSQL instance accessible at the host and port in `.env`. Copy `.env.example` to `.env`, set `DB_HOST=localhost`, then execute:

```bash
npm install
npm run start:dev
```

In a second terminal, seed the database:

```bash
npm run seed:dev
```

For the compiled build and compiled seeder:

```bash
npm run build
npm run seed
npm run start:prod
```

## Environment variables

| Variable | Purpose | Example |
|---|---|---|
| `PORT` | HTTP listening port | `3000` |
| `DB_HOST` / `DB_PORT` | PostgreSQL host and port | `localhost` / `5432` |
| `DB_USERNAME` / `DB_PASSWORD` | PostgreSQL credentials | `postgres` / `postgres` |
| `DB_NAME` | Database name | `fleetcore` |
| `DB_SSL` | Enable PostgreSQL TLS | `false` |
| `DB_SYNCHRONIZE` | Create/update schema from entities | `true` for this assessment only |
| `JWT_SECRET` | JWT signing secret, at least 24 characters | Replace the sample value |
| `JWT_EXPIRES_IN` | JWT expiration duration | `1h` |
| `API_KEYS` | Comma-separated partner API keys | `demo-key-partner-1,demo-key-partner-2` |
| `BCRYPT_ROUNDS` | bcrypt work factor (10–15) | `12` |
| `CORS_ORIGIN` | Allowed browser origin or `*` | `*` |

Startup validation rejects invalid or missing required environment variables. When running Compose, the API container receives `DB_HOST=postgres` automatically, independently of the host's `DB_HOST` setting.

## Seeded accounts and sample records

The seed command reuses stable identifiers (email, mechanic email, workshop name, vehicle plate, and maintenance reference code), so running it more than once does not create duplicate seed records.

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@fleetcore.example.com` | `AdminPass123!` |
| TECHNICIAN | `alex.technician@fleetcore.example.com` | `TechPass123!` |
| TECHNICIAN | `jamie.technician@fleetcore.example.com` | `TechPass123!` |

Seed content includes two active mechanics linked to the technician accounts, one inactive mechanic, one active and one inactive workshop, four vehicles with the required initial states, one `IN_PROGRESS` maintenance, and one `COMPLETED` maintenance for history. Passwords are hashed with bcrypt when records are created.

## Authorization model

| Operation | ADMIN | TECHNICIAN |
|---|---:|---:|
| Register/login | Public endpoints | Public endpoints; public registration creates `TECHNICIAN` only |
| Create users or assign the ADMIN role | Yes | No |
| List/view vehicles | Yes | Yes |
| Create/update/inactivate vehicles | Yes | No |
| Manage mechanics and workshops | Yes | No |
| Create or list all maintenances, query other mechanic assignments, audit history | Yes | No |
| List own assigned maintenances and read own assignment details | Yes | Yes, own assignments only |
| Change maintenance status | Yes | Yes, own assignments only |
| External vehicle history lookup | API key only | API key only |

`@Public()`, `@Roles()`, and `@CurrentUser()` are implemented as custom decorators. The global `JwtAuthGuard` enforces bearer JWT authentication by default; the global `RolesGuard` applies declared role restrictions; the integrations route opts out of JWT authentication and applies `ApiKeyGuard` to `x-api-key`.

## States and business rules

### Vehicle

- `AVAILABLE`: eligible to be scheduled for maintenance.
- `IN_MAINTENANCE`: set automatically when a maintenance transitions to `IN_PROGRESS`.
- `INACTIVE`: cannot be assigned to new maintenance; deletion is logical and history is retained.

Administrators cannot manually set a vehicle to `IN_MAINTENANCE`. A vehicle with an active maintenance cannot be inactivated or manually marked available. When maintenance completes, the API changes the vehicle to `AVAILABLE` and updates its mileage to the validated final mileage. Cancelling an in-progress maintenance returns the vehicle to `AVAILABLE`.

### Mechanic and workshop

- Mechanics use `ACTIVE` / `INACTIVE`; inactive mechanics cannot be assigned to new maintenance.
- Workshops use `ACTIVE` / `INACTIVE`; inactive workshops cannot be assigned to new maintenance.
- A mechanic is linked optionally to a `TECHNICIAN` user and is not permanently linked to a workshop.
- A mechanic cannot have overlapping `SCHEDULED` or `IN_PROGRESS` assignments. Time intervals are treated as half-open: a job ending at 09:00 does not overlap a job beginning at 09:00.

### Maintenance

- Types: `PREVENTIVE`, `CORRECTIVE`.
- States: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- New maintenance starts at `SCHEDULED`.
- Allowed transitions: `SCHEDULED → IN_PROGRESS`, `SCHEDULED → CANCELLED`, `IN_PROGRESS → COMPLETED`, `IN_PROGRESS → CANCELLED`.
- `COMPLETED` and `CANCELLED` are terminal states. Invalid transitions return HTTP `409 Conflict` with a descriptive message.
- A vehicle cannot have more than one active maintenance. The maintenance mileage cannot be lower than current vehicle mileage.
- Completing work requires `workPerformed`, `finalCost`, `finishedAt`, and `finalMileage`; final mileage cannot be lower than the maintenance or current vehicle mileage.

## API base path and Swagger

- API base path: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/docs`


All protected routes use the `Authorization: Bearer <accessToken>` header. The Swagger login request includes ready-to-use seeded credentials. After login, copy `data.accessToken` into Swagger's **Authorize** dialog.

### Main routes

| Method | Route | Access |
|---|---|---|
| `POST` | `/auth/register` | Public; creates TECHNICIAN |
| `POST` | `/auth/login` | Public |
| `GET` | `/auth/me` | Authenticated |
| `GET`, `POST` | `/users` | ADMIN; create is `POST /users` |
| `PATCH` | `/users/:id` | ADMIN |
| `GET`, `POST` | `/vehicles` | Authenticated list; ADMIN create |
| `GET` | `/vehicles/:id` | Authenticated |
| `GET` | `/vehicles/plate/:plate` | Authenticated |
| `PATCH`, `DELETE` | `/vehicles/:id` | ADMIN; DELETE is logical inactivation |
| `GET`, `POST` | `/mechanics` | ADMIN |
| `GET`, `PATCH` | `/mechanics/:id` | ADMIN |
| `PATCH` | `/mechanics/:id/status` | ADMIN |
| `GET` | `/workshops` | Authenticated; active workshops |
| `GET` | `/workshops/all` | ADMIN; active and inactive workshops |
| `GET`, `POST` | `/workshops` | ADMIN create; authenticated read |
| `PATCH` | `/workshops/:id` and `/workshops/:id/status` | ADMIN |
| `POST` | `/maintenances` | ADMIN |
| `GET` | `/maintenances`, `/maintenances/active` | ADMIN |
| `GET` | `/maintenances/mine` | TECHNICIAN; own assignments |
| `GET` | `/maintenances/:id` | ADMIN or assigned TECHNICIAN |
| `PATCH` | `/maintenances/:id/status` | ADMIN or assigned TECHNICIAN |
| `GET` | `/maintenances/vehicle/:vehicleId/history` | ADMIN |
| `GET` | `/maintenances/vehicle/:vehicleId` | ADMIN |
| `GET` | `/maintenances/mechanic/:mechanicId` | ADMIN |
| `GET` | `/audits` | ADMIN |
| `GET` | `/integrations/vehicles/:identifier/maintenance-history` | `x-api-key` only |

## Response contracts

Successful responses use the global interceptor:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

Errors use the custom exception filter:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Vehicle ABC123 already has an active maintenance.",
  "path": "/api/v1/maintenances",
  "timestamp": "2026-10-20T19:00:00.000Z"
}
```

Unique-value and foreign-key database conflicts are normalized to `409 Conflict`; invalid inputs use `400`, missing resources use `404`, missing/invalid credentials use `401`, and insufficient role/assignment permissions use `403`.

## External partner integration

This route does not require a JWT. It requires an exact API key configured in `API_KEYS`:

```bash
curl --request GET \
  --url http://localhost:3000/api/v1/integrations/vehicles/FLC1001/maintenance-history \
  --header 'x-api-key: demo-key-partner-1'
```

The identifier can be a vehicle plate or numeric ID. The response returns the vehicle's `available` boolean and its maintenance history, including mechanic and workshop summaries.

## Postman and SQL resources

- `docs/fleetcore_schema_and_sample_data.sql`: PostgreSQL DDL and demonstration records for an empty database. The standard runtime workflow uses `npm run seed`, which is idempotent and bcrypt-hashes passwords in the application.

## Static review note

The deliverable was reviewed by reading the source, module registrations, entity relations, DTO decorators, route decorators, Docker definitions, and seeding flow. Per the requested verification constraint, the API, Docker image, SQL script, and automated tests were not executed; runtime behavior is therefore not claimed as empirically tested.

