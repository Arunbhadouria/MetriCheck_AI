import pg from 'pg';
import { User } from '@metricheck/shared-types';

const { Pool } = pg;

export interface DatabaseStatus {
  engine: 'PostgreSQL' | 'Persistent JSON Database';
  connected: boolean;
  details: string;
}

let pool: pg.Pool | null = null;
let postgresConnected = false;

export async function initializeDatabase(): Promise<DatabaseStatus> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return {
      engine: 'Persistent JSON Database',
      connected: true,
      details: 'Active persistent file-backed database storage/db.json'
    };
  }

  try {
    const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
      ssl: isLocalhost ? false : { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    postgresConnected = true;

    // Run schema migrations for users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        employee_id VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(32),
        role VARCHAR(32) DEFAULT 'INSPECTOR',
        department VARCHAR(255),
        jurisdiction_state VARCHAR(128),
        jurisdiction_district VARCHAR(128),
        jurisdiction_zone VARCHAR(128),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    console.log('Connected to PostgreSQL database successfully.');

    return {
      engine: 'PostgreSQL',
      connected: true,
      details: `Connected to PostgreSQL on ${connectionString.split('@')[1] || 'localhost'}`
    };
  } catch (err: any) {
    console.warn(`PostgreSQL connection failed (${err.message}). Falling back to persistent storage/db.json.`);
    postgresConnected = false;
    return {
      engine: 'Persistent JSON Database',
      connected: true,
      details: 'Fallback to persistent file-backed storage/db.json'
    };
  }
}

export async function syncUserToPostgres(user: User): Promise<void> {
  if (!pool || !postgresConnected) return;

  try {
    await pool.query(
      `INSERT INTO users (
        id, employee_id, name, email, password_hash, mobile_number,
        role, department, jurisdiction_state, jurisdiction_district, jurisdiction_zone, active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (employee_id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        updated_at = EXCLUDED.updated_at`,
      [
        user.id,
        user.employeeId,
        user.name,
        user.email,
        user.passwordHash || '',
        user.mobileNumber || null,
        user.role,
        user.department,
        user.jurisdictionState || null,
        user.jurisdictionDistrict || null,
        user.jurisdictionZone || null,
        user.active,
        user.createdAt,
        user.updatedAt
      ]
    );
  } catch (err: any) {
    console.warn('PostgreSQL user sync warning:', err.message);
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return postgresConnected && pool
    ? { engine: 'PostgreSQL', connected: true, details: 'Active PostgreSQL live connection' }
    : { engine: 'Persistent JSON Database', connected: true, details: 'storage/db.json file-backed database' };
}
