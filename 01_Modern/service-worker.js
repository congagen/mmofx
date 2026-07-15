// Single source of truth for the asset version. Bump this together with the
// ?v= query strings in index.html on every release. The cache name is derived
// from it, so the precache URLs can never drift out of sync with index.html.
const ASSET_VERSION = '105';
const APP_CACHE_NAME = 'mmofx-app-v' + ASSET_VERSION;

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './custom-client-template.html',
    './client-designer.html',
    './img/logo.png?v=' + ASSET_VERSION,

    './css/styles.css?v=' + ASSET_VERSION,
    './css/pianoroll.css?v=' + ASSET_VERSION,
    './css/bootstrap.min.css',
    './css/gridstack.min.css',

    './js/libs/bootstrap.bundle.min.js',
    './js/libs/gridstack-all.min.js',
    './js/libs/firebase-app-compat.min.js',
    './js/libs/firebase-auth-compat.min.js',
    './js/libs/firebase-database-compat.min.js',
    './js/libs/jquery.min.js',

    './js/alerts.js?v=' + ASSET_VERSION,
    './js/elements.js?v=' + ASSET_VERSION,
    './js/params.js?v=' + ASSET_VERSION,
    './js/firebase-config.js?v=' + ASSET_VERSION,
    './js/network.js?v=' + ASSET_VERSION,
    './js/ui.js?v=' + ASSET_VERSION,
    './js/session.js?v=' + ASSET_VERSION,
    './js/iosAudio.js?v=' + ASSET_VERSION,
    './js/audio.js?v=' + ASSET_VERSION,
    './js/sequ.js?v=' + ASSET_VERSION,
    './js/pianoroll.js?v=' + ASSET_VERSION
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(APP_CACHE_NAME).then(function(cache) {
            console.log('[Service Worker] Precaching App Shell:', APP_CACHE_NAME);
            return cache.addAll(PRECACHE_URLS);
        })
        .then(function() {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    // Delete old caches with the same prefix but a different version.
                    return cacheName.startsWith('mmofx-app-') && cacheName !== APP_CACHE_NAME;
                }).map(function(cacheName) {
                    console.log('[Service Worker] Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
        .then(function() {
            return self.clients.claim(); // Takes control of any currently open pages
        })
    );
});

self.addEventListener('fetch', function(event) {
    const request = event.request;

    // Only handle same-origin GET requests. Everything else (Firebase realtime
    // DB, auth, analytics, POST, cross-origin, websockets, chrome-extension)
    // is left to the browser's default handling — caching it would be wrong,
    // and cache.put() throws on non-GET requests anyway.
    if (request.method !== 'GET') {
        return;
    }
    if (new URL(request.url).origin !== self.location.origin) {
        return;
    }

    // Network-first WITH A TIMEOUT, then cache fallback.
    //
    // Plain network-first only falls back to cache when fetch() *rejects*. That
    // happens fast when fully offline (airplane mode), so the PWA loads from
    // cache instantly. But a VPN/firewall that BLACK-HOLES connections doesn't
    // reject: navigator.onLine stays true and the socket just hangs on a long
    // TCP timeout, so fetch() sits pending and the app is stuck on a white
    // screen — "limbo" — even though the whole shell is sitting in the cache.
    //
    // Racing the network against a short timer fixes that: if the network
    // doesn't answer in NETWORK_TIMEOUT_MS we serve cache immediately (the
    // background fetch is left running so it still refreshes the cache if/when
    // it eventually resolves). Online, the network almost always wins the race,
    // so freshness is unchanged.
    const NETWORK_TIMEOUT_MS = 3000;

    event.respondWith((async function () {
        const cache = await caches.open(APP_CACHE_NAME);

        // Kick off the network request; refresh the cache in the background on
        // success. Resolves to null (never rejects) so it's safe to race/await.
        const networkFetch = fetch(request).then(function (networkResponse) {
            if (networkResponse && networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        }).catch(function () { return null; });

        const timeout = new Promise(function (resolve) {
            setTimeout(function () { resolve('TIMEOUT'); }, NETWORK_TIMEOUT_MS);
        });

        const winner = await Promise.race([networkFetch, timeout]);
        // A real response that came back in time wins outright.
        if (winner && winner !== 'TIMEOUT') return winner;

        // Timed out (hanging network) or fetch failed (offline): serve cache.
        //
        // ignoreSearch drops the ?v= query when matching. Right after a version
        // bump the old cache (holding the previously-versioned URLs) is deleted
        // in activate(), but a page already in memory — e.g. the cached
        // index.html iOS restores on a cold standalone launch — still references
        // the OLD ?v= URLs. Matching by path lets the freshly-cached version
        // satisfy the stale URL, so the app shell stays intact across updates.
        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;

        // Nothing cached: wait out the network as a last resort.
        const late = await networkFetch;
        return late || new Response(
            'You are offline, and this resource is not cached.',
            { status: 503, headers: { 'Content-Type': 'text/plain' } }
        );
    })());
});
