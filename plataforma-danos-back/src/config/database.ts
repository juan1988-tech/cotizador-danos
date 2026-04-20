import { Pool } from 'pg';

export const pool = new Pool({
  host:             process.env['DB_HOST']     ?? 'localhost',
  port:             parseInt(process.env['DB_PORT'] ?? '5432', 10),
  database:         process.env['DB_NAME']     ?? 'cotizador_danos',
  user:             process.env['DB_USER']     ?? 'admin',
  password:         process.env['DB_PASSWORD'] ?? 'admin123',
  max:              20,
  idleTimeoutMillis:    30_000,
  connectionTimeoutMillis: 2_000,
});
