import type { QueryResult, SqlDatabase, SqlExecutor, SqlParameter } from './ports.ts';

// Structural driver port: compatible with pg Pool, without importing provider types.
export interface PoolConnection {
  query(statement: string, parameters?: readonly SqlParameter[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  release(error?: Error | boolean): void;
}
export interface ConnectionPool {
  connect(): Promise<PoolConnection>;
  end(): Promise<void>;
}
export function createPooledDatabase(pool: ConnectionPool): SqlDatabase {
  return Object.freeze({
    async query<Row extends Record<string, unknown>>(statement: string, parameters: readonly SqlParameter[]): Promise<QueryResult<Row>> {
      const connection = await pool.connect();
      try {
        const result = await connection.query(statement, parameters);
        return { rows: result.rows as Row[], rowCount: result.rowCount ?? 0 };
      } finally { connection.release(); }
    },
    async transaction<T>(work: (transaction: SqlExecutor) => Promise<T>): Promise<T> {
      const connection = await pool.connect();
      let discard = false;
      let live = true;
      try {
        await connection.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
        await connection.query("SET LOCAL statement_timeout = '5s'");
        await connection.query(`SELECT set_config('app.user_id', '', true), set_config('app.tenant_id', '', true),
          set_config('app.request_id', '', true), set_config('app.identity_provider', '', true),
          set_config('app.identity_issuer', '', true), set_config('app.identity_subject', '', true)`);
        const tx: SqlExecutor = {
          async query<Row extends Record<string, unknown>>(statement: string, parameters: readonly SqlParameter[]) {
            if (!live) throw new Error('Transaction already finished');
            const result = await connection.query(statement, parameters);
            return { rows: result.rows as Row[], rowCount: result.rowCount ?? 0 };
          },
        };
        const result = await work(tx);
        await connection.query('COMMIT');
        return result;
      } catch (error) {
        try { await connection.query('ROLLBACK'); } catch { discard = true; }
        throw error;
      } finally { live = false; connection.release(discard || undefined); }
    },
    close() { return pool.end(); },
  });
}
