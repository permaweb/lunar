declare global {
	interface Window {
		arweaveWallet: any; // Replace 'any' with the appropriate type for 'arweaveWallet'
		permawebConnect?: any;
		aoFetch?: import('./aoNetwork').InjectedAoFetch;
	}
}

export {};
