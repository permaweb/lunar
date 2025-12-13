const CACHE_NAME = 'lunar-bundle-cache-v1';
const ARNS_ID_KEY = 'lunar-arns-id';

const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', (event) => {
	console.log('[Service Worker] Installing...');
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log('[Service Worker] Caching initial files');
			return cache.addAll(urlsToCache);
		})
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	console.log('[Service Worker] Activating...');
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log('[Service Worker] Deleting old cache:', cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip HEAD requests (used for ArNS ID checks)
	if (request.method !== 'GET') {
		return;
	}

	// Only cache same-origin requests for bundle files
	if (url.origin !== location.origin) {
		return;
	}

	// Skip requests with no-store cache directive
	if (request.cache === 'no-store') {
		return;
	}

	// Cache bundle files (JS, CSS, fonts, images, etc.)
	const isBundleFile =
		url.pathname.endsWith('.js') ||
		url.pathname.endsWith('.css') ||
		url.pathname.endsWith('.woff') ||
		url.pathname.endsWith('.woff2') ||
		url.pathname.endsWith('.ttf') ||
		url.pathname.endsWith('.svg') ||
		url.pathname.endsWith('.png') ||
		url.pathname.endsWith('.jpg') ||
		url.pathname.endsWith('.jpeg') ||
		url.pathname.endsWith('.webp') ||
		url.pathname.includes('/assets/');

	if (isBundleFile) {
		event.respondWith(
			caches.match(request).then((cachedResponse) => {
				// Try to fetch from network first
				const fetchPromise = fetch(request)
					.then((response) => {
						// Only cache successful responses
						if (response && response.status === 200 && response.type === 'basic') {
							const responseToCache = response.clone();
							caches.open(CACHE_NAME).then((cache) => {
								console.log('[Service Worker] Caching new file:', request.url);
								cache.put(request, responseToCache);
							});
						}
						return response;
					})
					.catch((error) => {
						console.warn('[Service Worker] Fetch failed for:', request.url, error);
						// If fetch fails and we have a cached version, use it
						if (cachedResponse) {
							console.log('[Service Worker] Using cached fallback for:', request.url);
							return cachedResponse;
						}
						// If no cached version, throw the error
						throw error;
					});

				// If we have a cached response, validate it works, otherwise fetch
				if (cachedResponse) {
					console.log('[Service Worker] Found cached response for:', request.url);
					// Return cached response immediately, but verify it in background
					return cachedResponse
						.clone()
						.blob()
						.then(() => {
							console.log('[Service Worker] Serving valid cache for:', request.url);
							return cachedResponse;
						})
						.catch(() => {
							// Cached response is corrupted, fetch from network
							console.warn('[Service Worker] Cached response corrupted, fetching from network:', request.url);
							return fetchPromise;
						});
				}

				// No cached response, fetch from network
				return fetchPromise;
			})
		);
	}
});

// Listen for cache clear message from the main app
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'CLEAR_CACHE') {
		console.log('[Service Worker] Clearing all caches...');
		event.waitUntil(
			caches
				.keys()
				.then((cacheNames) => {
					return Promise.all(
						cacheNames.map((cacheName) => {
							console.log('[Service Worker] Deleting cache:', cacheName);
							return caches.delete(cacheName);
						})
					);
				})
				.then(() => {
					console.log('[Service Worker] All caches cleared');
					// Notify all clients that cache has been cleared
					self.clients.matchAll().then((clients) => {
						clients.forEach((client) => {
							client.postMessage({
								type: 'CACHE_CLEARED',
							});
						});
					});
				})
		);
	}
});
