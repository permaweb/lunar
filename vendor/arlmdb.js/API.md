# arlmdb.js — API contract

Answer Arweave GraphQL in the browser from a published `~match@1.0` predicate
index (an LMDB 1.0 container on Arweave), read in place with `lmdb-wasm`.
Nothing is downloaded but the chunks a query touches. Every step emits an
event, so a UI can draw the work as it happens.

This file is the contract between the engine, the UI and any other consumer.
Implementations follow it exactly; changes to it are made here first.

## Index facts (the default container)

- tx `oWRzBr3KHhULAL-s5ULeXac1mb_WQOX5uFBRea16iRI`, 667,772,256,256 bytes,
  weave start 390,550,266,618,103 (= offset 391,218,038,874,358 − size + 1),
  data_root `2yuV8J79b2lftUCLVn3z_lRzgw-xKIKUTZKEtPS4Lqw`.
- LMDB 1.0, **4 KiB pages**, 163,030,307 pages, main DB `DUPSORT|DUPFIXED`,
  10-byte keys, 6-byte dups, main depth 5, dup trees up to depth 4,
  70,130,786,753 rows, 7,465,273,959 keys.
- Row (128 bits) = `key-hash:39 | value-hash:40 | offset:49`; physical key =
  first 80 bits (so bit 79 is the offset's top bit), dup = low 48 bits.
  **One predicate spans two adjacent physical keys** (offset-high 0 and 1).
- `key-hash` = leading 39 bits of SHA-256(`~match@1.0/` ‖ ascii-lowercased
  name); `value-hash` = leading 40 bits of SHA-256(value, as given).
- Predicate families: every tag `name=value`; `committer=<owner address>`;
  `field-target=<target>`; `parent=<enclosing item id>` (nested only);
  `commitment-device=ans104@1.0`. Item ids and L1 txs are NOT indexed.
  Cutoff block 1,988,355.
- Owner address: RSA → base64url(sha256(owner key)); secp256k1 (65-byte
  uncompressed key) → EIP-55 of keccak256(key[1:])[-20:]; ed25519 (32 bytes)
  → base58. See `~/operations/gql-match-validation/groundtruth/addr.py`.

## Module layout

```
src/index.js       re-exports everything below
src/transport.js   ChunkSource: chunk fetch, Merkle verify, cache, read-ahead, node routing
src/container.js   openIndex(): tx placement + tags → LmdbEnv over a ChunkSource
src/predicate.js   hashing, physical keys, row decode, address derivation
src/match.js       locate() leapfrog, count(), nearest()
src/blocks.js      block height → weave offset window
src/items.js       readHeader(offset) → ANS-104 header fields
src/graphql.js     parse (graphql npm, language only) + plan + execute
src/events.js      the Emitter and the event vocabulary below
```

## Public API

```js
import { openIndex, execute, buildQuery } from 'arlmdb.js';

const index = await openIndex({
  id: 'oWRzBr3K…',                 // or { start, size, dataRoot, tags }
  gateway: 'https://arweave.net',  // /tx, /tx/offset, /tx/tags, /chunk, /block
  chunkSources: [ /* optional http://data-N.arweave.xyz:1984 … */ ],
  readAhead: 0,                    // chunks to prefetch past a leaf read; off: measured 1 of 16 ever used
  onEvent: (e) => {},              // every event below; also index.on(type, fn)
});
// index.tags, index.pageSize, index.rows, index.depth, index.start, index.size,
// index.dataRoot, index.env (the LmdbEnv), index.source (the ChunkSource),
// index.stats() → { requests, bytes, hits, verified, networkMs, verifyMs, pages }

const run = execute(index, queryText, { variables, onEvent });
// run.plan     → { predicates:[{name,value,prefix}], direction, window, first, after, fields }
//   fields: the selection, in query order, each `{ name, alias, sub }` where `sub` is
//   null for a scalar and the nested list for a field with a selection, e.g.
//   [{ name:'count', alias:'count', sub:null },
//    { name:'edges', alias:'edges', sub:[{ name:'node', alias:'node', sub:[{ name:'id', … }] }] }]
// run.offsets  → Promise<{ offsets:[bigint], hasNextPage, ms }>   (the locate phase)
// run.result   → Promise<{ data, errors, timing:{ parse, plan, locate, headers, total } }>
// run.cancel()
// events during run (see below); results stream: 'result:slot' then 'result:node'
```

`buildQuery({ tags:[{name,values:[v]}], owners, recipients, bundledIn,
block:{min,max}, first, after, sort })` → the GraphQL text the builder UI
emits (round-trips through `execute`).

### GraphQL surface (Arweave schema subset, served from the index)

`transactions(first, after, sort: HEIGHT_ASC|HEIGHT_DESC, tags:[{name, values}],
owners, recipients, bundledIn, block:{min,max}) { count pageInfo { hasNextPage }
edges { cursor node { id anchor signature recipient owner { address key }
tags { name value } data { size type } block { height } bundledIn { id } } } }`

- Every filter value must be single-valued to be a predicate (a tag with
  several values → GraphQL error `unservable`, message says why). `ids` is
  unservable (ids are not predicates). `block{min,max}` → offset window via
  `/block/height/N` (`weave_size − block_size` .. `weave_size`).
- A tag value of `*` means that tag name exists with any value. The wildcard
  cursor enumerates that name's adjacent value-hash keys with `NEXT_NODUP`,
  opens each ordered duplicate-offset stream, and heap-merges those streams
  by weave offset. It never reads item headers to decide membership.
- Order: HEIGHT_DESC = descending weave offset (default). Cursor =
  `offset=<n>`; page = one leapfrog walk of `first+1` offsets from the
  cursor (exclusive) within the window; `hasNextPage` from the extra one.
  `first` defaults to 20 and is capped at 50.
- `count`: exact from LMDB's cursor count for one unwindowed predicate
  (sum over both physical keys); otherwise a walk up to `countLimit`
  (default 1000) reported as a lower bound (`exact:false`).
- A node = one header read at its offset: `id` (sha256 of signature),
  `owner.address`, `owner.key`, `signature`, `anchor`, `recipient` (target),
  `tags`. `data.type` is the Content-Type tag, free. `data.size` is not in the header: it is read from the enclosing bundle's own index — one chunk per bundle, kept for the session, charged to the node — **only when the query selects it** (the index's whole-item size less the header, i.e. the data size arweave.net reports), and is absent otherwise;
  `block` and `bundledIn` → null (not in the index or the header).

### The leapfrog (port of dev_match:locate)

```
cursor := from (asc: window.start or after+1; desc: window.end-1 or after-1)
loop while limit > 0 and cursor inside window:
  for each predicate P in order:
    o := nearest(P, cursor, direction)        // first row of P at/after (asc) or at/before (desc) cursor
    if o is none → exhausted, stop
    if o ≠ cursor → cursor := o; restart the for-loop
  emit cursor; cursor := cursor ± 1; limit--
```

`nearest(P, cursor, direction)` seeks the exact key80 and low48 duplicate
together with `GET_BOTH_RANGE`. Descending bounds use `PREV_DUP` or
`LAST_DUP` as needed, confirming the exact key after an unsuccessful seek.
`GET_MULTIPLE` copies only the already-resident duplicate leaf. Subsequent
probes binary-search those offsets without calling LMDB. Exhausting that
leaf sequentially uses `NEXT_MULTIPLE`/`PREV_MULTIPLE`; a larger leap seeks
directly. Crossing 2^48 tries only the other key of the same predicate.
One probe event reports `method: seek|step|buffer`. A logical seek can
contain several native cursor operations; it is not a page-read count.

## Events (`{ type, at: performance.now(), …fields }`)

```
index:open        { id, start, size, pageSize, depth, rows }
chunk:request     { index, absolute, source, readAhead:boolean }
chunk:received    { index, bytes, source, ms }
chunk:verified    { index, ms, verified:boolean }           // Merkle vs data_root
chunk:hit         { index }                                  // served from cache
chunk:failed      { index, source, error }
page:read         { page, pgno, chunk, cached:boolean, kind:'meta'|'branch'|'leaf'|'sub', entries:number|null, bytes, ms, predicate?, traversal?:{id,method,parent?} }
query:parsed      { ms, document }
query:planned     { plan, ms }
locate:probe      { predicate, cursor, direction, method:'seek'|'step'|'buffer', traversal?:{id,method,parent?}, answer:bigint|null, ms }
locate:match      { offset }
locate:done       { count, hasNextPage, ms }
count:done        { count, exact, ms }
result:slot       { i, offset, cursor }                      // outline appears
result:node       { i, offset, node, ms, requests, bytes }   // filled in
result:failed     { i, offset, error }
query:done        { timing }
```

Chunk `index` is the 256 KiB chunk number within the container; `page` is
the container-relative page number (`offset / pageSize`); a page's chunk is
`floor(page * pageSize / 262144)`. The visualiser maps pages→cells and
chunks→cells; the engine never assumes a renderer. A wildcard duplicate-tree
seek names the `NEXT_NODUP` traversal that selected its value key as `parent`;
this is trace structure only and does not cause another read.

## Transport (reuse chunkar's engine.js, `~/src/chunkar/src/engine.js`)

- `/chunk/<absolute>` on the gateway or on `chunkSources` (fleet nodes are
  HTTP-only, CORS `*`); `absolute_end_offset` places a chunk; chunk API is
  1-based (`container byte i` ↔ `start + i`), item offsets are 0-based
  (`/chunk/(offset+1)`).
- Every chunk is Merkle-validated against `data_root` before use
  (`weave.js: validatePath`, port from chunkar); an unverifiable chunk is
  refused, not used. Item chunks are validated against the *item's own
  parent tx* data_root only if known — otherwise `chunk:verified` carries
  `verified:false` honestly.
- Read-ahead: after a leaf-page read, prefetch the next chunk in walk
  direction (`readAhead` chunks), emitted with `readAhead:true`. A read-ahead
  asks only the gateway; a walk read that joins one in flight continues
  through `chunkSources` when the gateway misses. A read-ahead the gateway
  answered with a status is remembered: a later walk read of that chunk goes
  straight to `chunkSources` (or fails with the miss when there are none),
  and no read-ahead asks the gateway for it again.
- A source that answers with a status is not asked again for that chunk; a
  source that fails to answer (reset, timeout) is asked once more after a
  short pause. Every attempt is a `chunk:request`.
- Cache: Map by chunk index; `index.source.clear()`; stats as above.

## Tests (`npm test` offline; `npm run test:live` against arweave.net)

Offline: hashing vectors (`Content-Type=image/png` → prefix79 hex
`ebb37cb6d12c90b5796c` with the low bit clear = key80 hex
`ebb37cb6d12c90b5796c`; `App-Name=SmartWeaveContract` → `73a6108cbfa81d42a568`;
`Data-Protocol=ao` → `ad2ef4c5b05ba8226116`), address vectors (EIP-55 test
vector from addr.py), the leapfrog over an in-memory fake `nearest`, the
GraphQL planner (which queries are servable), buildQuery round-trip.
Live: open the index (1 GET), `count` of `Content-Type=image/png` = 77,246,255,
`App-Name=ArDrive-App` = 99,633,156, a two-predicate intersection page,
header reads for the first 3 results with ids cross-checked against
`https://arweave.net/graphql` for the same tags (HEIGHT_DESC), and every
item in `~/operations/gql-match-validation/groundtruth/items.json` whose
offset is in `offsets.json`: locate on one of its tags must include that
offset.
