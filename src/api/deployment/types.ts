/** The transaction a deployment name currently points at. */
export type DeploymentRecord = {
	name: string;
	process: string;
	transactionId: string;
};

export type DeploymentApiErrorCode = 'cancelled' | 'invalid-response' | 'not-found' | 'unavailable';

export class DeploymentApiError extends Error {
	readonly code: DeploymentApiErrorCode;

	constructor(code: DeploymentApiErrorCode, message: string) {
		super(message);
		this.name = 'DeploymentApiError';
		this.code = code;
	}
}
