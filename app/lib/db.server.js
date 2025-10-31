// ...existing code...
import mysql from "mysql2/promise";

let pool;

/**
 * getPool()
 * - uses environment variables:
 *    DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
 * - returns a mysql2/promise pool singleton
 */
export function getPool() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    database: process.env.DB_NAME || "test",
    waitForConnections: true,
    connectionLimit: 10,
  });

  return pool;
}

export async function getUsers() {
  const p = getPool();
  const [rows] = await p.query("SELECT id, name, email FROM Users");
  return rows;
}

export async function createUser(data) {
  const p = getPool();
  const [result] = await p.execute(
    "INSERT INTO Users (name, email) VALUES (?, ?)",
    [data.name || null, data.email || null]
  );
  // result.insertId is available from mysql2
  return { id: result.insertId ?? null, ...data };
}
// ...existing code...