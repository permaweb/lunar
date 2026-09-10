# Client-side node locations

The Nodes page discovers endpoints exclusively through the browser's request to
`https://arweave.net/peers`. It enriches those endpoints using the public analytics
device at `https://stats.forward.computer/~analytics@1.0/`:

- `node-capabilities` enables node checks only after the service advertises support.
- `node-info?peer=<IPv4:port>` observes a single listed node. The browser allows eight
  concurrent requests and cancels queued/in-flight work when its row leaves view.
- `node-locations` supplies country codes, filtered to Lunar's own discovered peers.

Set `FLAGS.SHOW_NODES_LOADER` in `src/helpers/config.ts` to `true` to show the
full-page loader until ten reachable peers are ready. It defaults to `false` so
the table appears as soon as the peer list arrives, with initial checks continuing
in the background. Both modes use at most eight concurrent checks, configured by
`NODE_INFO_CONCURRENCY` in `src/helpers/config.ts`, preserve caching,
and then check visible rows. The table moves unavailable endpoints onto
later pages, keeping them off the first page even when fewer than 50 other peers
remain. If fewer than ten peers can be reached, discovery is exhausted, or the
initial 60-second check budget expires, the view shows the results obtained so far.
Repeated service errors pause checks and offer a refresh instead of leaving an
indefinite loading screen.

Validated observations are cached in memory and local storage for five minutes
when reachable and 30 seconds when unavailable. The peer list is cached for one
minute; Refresh always re-reads `arweave.net/peers`. Cache keys include the schema,
discovery URL, and analytics URL. Removed peers, invalid entries, and expired
observations are discarded; blocked storage falls back to memory. The Last Checked
column keeps the device's original observation time when a cached result is shown.

Lunar remains a static app. HTTP requests to individual nodes happen on the
analytics device, so reachability and latency reflect that device's connection.
Service failures leave rows “Not checked”; only an actual negative observation
is displayed as “Unavailable”. Node info requires deployment of the updated
`analytics@1.0` device from `~/arc/repos/analytics-1.0`.

If the geography endpoint fails, opening the map loads `ipv4-country.bin`, a
bundled static asset (1.79 MB for the September 2026 edition). The adapter validates
and caches it in memory, then resolves all peer IPs locally. The fallback asset is
reused across map opens. Closing the map aborts unfinished geography requests.
The attribution labels identify Analytics results or the bundled release.

The map groups endpoints by **country**, counting different ports on one IP as
separate nodes. Locations are approximate; they do not establish reachability.
Unknown locations remain unmapped. The current peer parser and fallback lookup
asset support public IPv4 addresses.

## Source and attribution

Derived from [DB-IP IP to Country Lite](https://db-ip.com/db/download/ip-to-country-lite),
September 2026, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Copyright DB-IP. Changes: IPv6 records omitted, adjacent IPv4 ranges with the same
country merged, and records encoded into a compact binary format. `metadata.json`
records the release, original source URL, source and derived SHA-256 checksums,
license, and modifications. The map includes a visible attribution link to
[DB-IP](https://db-ip.com).

## Updating the snapshot

Download a specific monthly CSV gzip release from DB-IP's page above, then run:

```sh
python3 scripts/update-node-country-data.py 2026-09 /path/to/dbip-country-lite-2026-09.csv.gz
```

Use the downloaded release's `YYYY-MM` value. Commit the generated binary and
metadata together, run the node adapter/database tests, and verify asset budgets.
This conversion is a maintainer action, never a network step during build or app
startup. Vite emits the asset with a content hash and a URL relative to the module
so it can be served from an Arweave transaction path or an ArNS domain.

## Binary format: LNC1

- Four ASCII magic bytes `LNC1`.
- Country count: unsigned 16-bit little endian.
- Range count: unsigned 32-bit little endian.
- Country table: two ASCII letters per country, including `ZZ` for unknown.
- Ranges: inclusive IPv4 end (unsigned 32-bit little endian), followed by the
  zero-based country index (unsigned byte).

Ranges are contiguous, sorted, and cover `0.0.0.0` through `255.255.255.255`.
Each start is implied by the previous end plus one. The adapter excludes private,
reserved, and invalid addresses before returning a country.
