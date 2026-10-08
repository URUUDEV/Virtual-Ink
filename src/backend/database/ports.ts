// Keep PostgreSQL driver and managed-provider SDK types outside business services.
export type SqlParameter = string | number | boolean | null | Date | Uint8Array;
export type QueryResult<Row> = Readonly<{ rows: readonly Row[]; rowCount: number }>;
export interface SqlExecutor {
  query<Row extends Record<string, unknown>>(
    statement: string, parameters: readonly SqlParameter[],
  ): Promise<QueryResult<Row>>;
}
export interface SqlDatabase extends SqlExecutor {
  // Use the same transaction for tenant context, mutations and required audits.
  transaction<T>(work: (transaction: SqlExecutor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
