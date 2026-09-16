import { requestRemote } from 'api/http';

import { DEPLOYMENT } from 'helpers/config';

import { DeploymentApiError, DeploymentRecord } from './types';

const ARWEAVE_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** A name is carried by one of these devices; anything else is not a deployment pointer. */
const NAME_TOKEN_DEVICES = new Set(['carrier@1.0', 'name-token@1.0']);

let deploymentRequest: Promise<DeploymentRecord> | null = null;
let resolvedDeployment: DeploymentRecord | null = null;

/** `AbortSignal.timeout` is unavailable in older browsers, where the read stays unbounded. */
function getTimeoutSignal(): AbortSignal | undefined {
	if (typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') return undefined;
	return AbortSignal.timeout(DEPLOYMENT.readTimeoutMs);
}

function getStateUrl(): string {
	if (!ARWEAVE_ID_PATTERN.test(DEPLOYMENT.process)) {
		throw new DeploymentApiError('invalid-response', 'The configured deployment process is not a transaction id');
	}

	const url = new URL(`${DEPLOYMENT.process}~process@1.0/now`, `${DEPLOYMENT.gateway}/`);
	url.searchParams.set('require-codec', 'application/json');
	url.searchParams.set('accept-bundle', 'true');

	return url.toString();
}

/** A name token holds its target directly, or beside the reference value it was issued from. */
function toTargetTransaction(value: unknown): string {
	if (typeof value === 'string') return value.trim();
	if (!value || typeof value !== 'object') return '';

	const carried = (value as Record<string, unknown>).target ?? (value as Record<string, unknown>)['reference-value'];
	return typeof carried === 'string' ? carried.trim() : '';
}

async function readDeployment(): Promise<DeploymentRecord> {
	let response: Response;

	try {
		response = await requestRemote(getStateUrl(), {
			headers: { accept: 'application/json' },
			signal: getTimeoutSignal(),
		});
	} catch (error) {
		if (error instanceof DeploymentApiError) throw error;
		const message = error instanceof Error ? error.message : 'Unknown error';
		throw new DeploymentApiError('unavailable', `Unable to read the deployment name token: ${message}`);
	}

	if (!response.ok) {
		throw new DeploymentApiError('unavailable', `The deployment name token responded with HTTP ${response.status}`);
	}

	let state: Record<string, unknown>;
	try {
		state = await response.json();
	} catch {
		throw new DeploymentApiError('invalid-response', 'The deployment name token state is not valid JSON');
	}

	const device = state['execution-device'] ?? state.device;
	if (typeof device !== 'string' || !NAME_TOKEN_DEVICES.has(device)) {
		throw new DeploymentApiError('invalid-response', 'The configured deployment process is not a name token');
	}

	if (state.name !== DEPLOYMENT.name) {
		throw new DeploymentApiError('not-found', `The name token no longer carries the name: ${DEPLOYMENT.name}`);
	}

	const transactionId = toTargetTransaction(state.value);
	if (!ARWEAVE_ID_PATTERN.test(transactionId)) {
		throw new DeploymentApiError('invalid-response', 'The deployment name does not point at a transaction id');
	}

	resolvedDeployment = { name: DEPLOYMENT.name, process: DEPLOYMENT.process, transactionId };

	return resolvedDeployment;
}

function withAbort<T>(request: Promise<T>, signal?: AbortSignal): Promise<T> {
	if (!signal) return request;
	if (signal.aborted) return Promise.reject(new DeploymentApiError('cancelled', 'Deployment lookup cancelled'));

	return new Promise<T>((resolve, reject) => {
		function handleAbort() {
			reject(new DeploymentApiError('cancelled', 'Deployment lookup cancelled'));
		}

		signal.addEventListener('abort', handleAbort, { once: true });
		request.then(resolve, reject).finally(() => signal.removeEventListener('abort', handleAbort));
	});
}

/**
 * The transaction the deployment name points at.
 *
 * A published deployment only changes when a new build is released, so the result is shared
 * for the lifetime of the page and retried only after a failure.
 */
export function getDeployedTransaction(options: { signal?: AbortSignal } = {}): Promise<DeploymentRecord> {
	if (!deploymentRequest) {
		deploymentRequest = readDeployment().catch((error) => {
			deploymentRequest = null;
			throw error;
		});
	}

	return withAbort(deploymentRequest, options.signal);
}

/** The already resolved deployment, so a remount can render it without an empty frame. */
export function peekDeployedTransaction(): DeploymentRecord | null {
	return resolvedDeployment;
}
