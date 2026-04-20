import { Quote } from '../models/Quote';

// ─── Minimal input type for creating a new quote ──────────────────────────────
export type NewQuote = Pick<Quote, 'numeroFolio'>;

// ─── Transaction scope exposed to callers ────────────────────────────────────
// Bundles a transaction-scoped IQuoteRepository with a raw query executor
// so cross-table operations (e.g. locations) can run in the same transaction
// without leaking pg internals to the use-case layer.
export interface TransactionScope {
  quotes: IQuoteRepository;
  rawQuery(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

// ─── IQuoteRepository ────────────────────────────────────────────────────────
export interface IQuoteRepository {
  /**
   * Returns the quote for the given folio, or null if it does not exist.
   */
  findByFolio(folio: string): Promise<Quote | null>;

  /**
   * Persists a new quote row with EN_EDICION state and version = 1.
   */
  save(data: NewQuote): Promise<Quote>;

  /**
   * Applies partial changes to an existing quote using optimistic locking.
   * Automatically increments the version column on success.
   *
   * @throws {QuoteNotFoundError}    when the folio does not exist.
   * @throws {VersionConflictError}  when expectedVersion differs from the DB version.
   */
  update(folio: string, changes: Partial<Quote>, expectedVersion: number): Promise<Quote>;

  /**
   * Executes fn inside a single database transaction.
   * The TransactionScope provides a transaction-scoped IQuoteRepository
   * plus a rawQuery executor for operating on other tables (e.g. locations)
   * within the same transaction boundary.
   *
   * If withTransaction is called when a transaction is already active
   * (i.e. nested call), the existing transaction is reused.
   */
  withTransaction<T>(fn: (scope: TransactionScope) => Promise<T>): Promise<T>;
}
