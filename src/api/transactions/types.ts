/**
 * What a transaction response body carries:
 * - `raw`: an unsigned gateway response whose body is the stored data.
 * - `committed`: a signed HyperBEAM message whose body is covered by its `content-digest`.
 * - `bundle`: a signed bundle. The node unpacks its items into links, so the body is not the bundle data.
 * - `none`: a signed message without data. Any body is the node's own page (for example its web UI).
 */
export type TransactionBody = 'raw' | 'committed' | 'bundle' | 'none';

export type TransactionDataErrorCode = 'cancelled' | 'invalid-input' | 'invalid-response' | 'not-found' | 'unavailable';

export type TransactionData =
	| { status: 'empty' }
	| { status: 'content'; text: string; contentType: string | null }
	| { status: 'error'; code: TransactionDataErrorCode };
