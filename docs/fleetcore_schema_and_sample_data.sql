-- FleetCore PostgreSQL schema and demonstration records.
-- Apply this file only to a new, empty database. The application workflow instead uses
-- TypeORM synchronization and `npm run seed`; the application seeder is idempotent.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE users_role_enum AS ENUM ('ADMIN', 'TECHNICIAN');
CREATE TYPE vehicles_status_enum AS ENUM ('AVAILABLE', 'IN_MAINTENANCE', 'INACTIVE');
CREATE TYPE mechanics_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE workshops_status_enum AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE maintenances_type_enum AS ENUM ('PREVENTIVE', 'CORRECTIVE');
CREATE TYPE maintenances_status_enum AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(180) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  role users_role_enum NOT NULL DEFAULT 'TECHNICIAN',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  plate VARCHAR(20) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year SMALLINT NOT NULL,
  mileage INTEGER NOT NULL DEFAULT 0,
  status vehicles_status_enum NOT NULL DEFAULT 'AVAILABLE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "UQ_vehicles_plate" ON vehicles (plate);

CREATE TABLE mechanics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  status mechanics_status_enum NOT NULL DEFAULT 'ACTIVE',
  user_id INTEGER UNIQUE NULL REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "UQ_mechanics_email" ON mechanics (email);

CREATE TABLE workshops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  address VARCHAR(240) NOT NULL,
  status workshops_status_enum NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE maintenances (
  id SERIAL PRIMARY KEY,
  reference_code VARCHAR(80) NULL UNIQUE,
  type maintenances_type_enum NOT NULL,
  description TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  scheduled_end_at TIMESTAMPTZ NOT NULL,
  status maintenances_status_enum NOT NULL DEFAULT 'SCHEDULED',
  work_performed TEXT NULL,
  final_cost NUMERIC(12,2) NULL,
  finished_at TIMESTAMPTZ NULL,
  final_mileage INTEGER NULL,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  mechanic_id INTEGER NOT NULL REFERENCES mechanics(id) ON DELETE RESTRICT,
  workshop_id INTEGER NOT NULL REFERENCES workshops(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "IDX_maintenances_vehicle_status" ON maintenances (vehicle_id, status);
CREATE INDEX "IDX_maintenances_mechanic_schedule" ON maintenances (mechanic_id, scheduled_start_at, scheduled_end_at);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(80) NOT NULL,
  resource VARCHAR(80) NOT NULL,
  resource_id VARCHAR(80) NULL,
  details JSONB NULL,
  actor_id INTEGER NULL REFERENCES users(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (id, email, "passwordHash", name, role, "isActive") VALUES
  (1, 'admin@fleetcore.example.com', crypt('AdminPass123!', gen_salt('bf', 12)), 'FleetCore Administrator', 'ADMIN', TRUE),
  (2, 'alex.technician@fleetcore.example.com', crypt('TechPass123!', gen_salt('bf', 12)), 'Alex Rivera', 'TECHNICIAN', TRUE),
  (3, 'jamie.technician@fleetcore.example.com', crypt('TechPass123!', gen_salt('bf', 12)), 'Jamie Morgan', 'TECHNICIAN', TRUE);

INSERT INTO mechanics (id, name, email, specialty, status, user_id) VALUES
  (1, 'Alex Rivera', 'alex.technician@fleetcore.example.com', 'Preventive maintenance', 'ACTIVE', 2),
  (2, 'Jamie Morgan', 'jamie.technician@fleetcore.example.com', 'Brakes and suspension', 'ACTIVE', 3),
  (3, 'Taylor Former', 'taylor.former@fleetcore.example.com', 'Electrical systems', 'INACTIVE', NULL);

INSERT INTO workshops (id, name, address, status) VALUES
  (1, 'Central Workshop', '123 Industrial Avenue, Barranquilla', 'ACTIVE'),
  (2, 'North Workshop', '45 North Logistics Road, Barranquilla', 'INACTIVE');

INSERT INTO vehicles (id, plate, brand, model, year, mileage, status) VALUES
  (1, 'FLC1001', 'Chevrolet', 'NPR', 2023, 45500, 'AVAILABLE'),
  (2, 'FLC1002', 'Isuzu', 'NQR', 2022, 32000, 'AVAILABLE'),
  (3, 'FLC1003', 'Hino', '300', 2021, 52300, 'IN_MAINTENANCE'),
  (4, 'FLC1004', 'Ford', 'Transit', 2020, 69000, 'INACTIVE');

INSERT INTO maintenances (
  id, reference_code, type, description, mileage, scheduled_start_at, scheduled_end_at,
  status, work_performed, final_cost, finished_at, final_mileage, vehicle_id, mechanic_id, workshop_id
) VALUES
  (1, 'SEED-COMPLETED-001', 'PREVENTIVE', 'Historical oil and filter replacement.', 45000,
   '2026-09-15T14:00:00Z', '2026-09-15T16:00:00Z', 'COMPLETED',
   'Changed engine oil and filters; inspected fluid levels.', 350000,
   '2026-09-15T16:30:00Z', 45500, 1, 1, 1),
  (2, 'SEED-IN-PROGRESS-001', 'CORRECTIVE', 'In-progress brake inspection and replacement.', 52300,
   now() - interval '1 hour',
   now() + interval '1 hour', 'IN_PROGRESS',
   NULL, NULL, NULL, NULL, 3, 2, 1);

SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users));
SELECT setval(pg_get_serial_sequence('mechanics', 'id'), (SELECT MAX(id) FROM mechanics));
SELECT setval(pg_get_serial_sequence('workshops', 'id'), (SELECT MAX(id) FROM workshops));
SELECT setval(pg_get_serial_sequence('vehicles', 'id'), (SELECT MAX(id) FROM vehicles));
SELECT setval(pg_get_serial_sequence('maintenances', 'id'), (SELECT MAX(id) FROM maintenances));
COMMIT;
