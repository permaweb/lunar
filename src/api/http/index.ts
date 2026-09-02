export function requestRemote(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	return fetch(input, init);
}
