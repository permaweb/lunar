# arlmdb.js

Answer Arweave GraphQL in the browser from a published `~match@1.0`
predicate index — an LMDB 1.0 container on Arweave — read in place with
[lmdb-wasm](arweave://lmdb-wasm). Nothing is downloaded but the chunks a
query touches; every one is checked against the container transaction's
Merkle root before it is used.

```js
import { openIndex, execute } from 'arlmdb.js';

const index = await openIndex({ id: 'oWRzBr3KHhULAL-s5ULeXac1mb_WQOX5uFBRea16iRI' });
const run = execute(index, `{
  transactions(first: 5, tags: [{ name: "App-Name", values: ["ArDrive-App"] }]) {
    edges { cursor node { id owner { address } tags { name value } } }
  }
}`);
const { data, timing } = await run.result;   // shaped like arweave.net's answer
```

`API.md` is the contract: every export, the GraphQL surface served, the
leapfrog intersection, and the event vocabulary. This file says how it
fits together and what it costs.

## How a query is answered

1. **Parse and plan.** The query is parsed with the reference `graphql`
   parser (language module only) and compiled to predicates: each single-
   valued tag, one owner (`committer`), one recipient (`field-target`), one
   bundle (`parent`), plus a block window and a cursor. Anything the index
   cannot answer — explicit ids, a tag with several values, no predicate at
   all — is refused as a GraphQL error that says why, before any byte is
   read.
2. **Locate.** Each predicate hashes to a 79-bit row prefix; the rows under
   it are weave offsets in order. The offsets carrying every predicate are
   found by leapfrog intersection — one LMDB cursor per predicate, each
   asked for its nearest row at or past the moving cursor — ported from
   `dev_match` in HyperBEAM. A page is `first + 1` offsets; the extra one is
   `hasNextPage`; the cursor is the offset itself, so paging is stateless.
3. **Headers.** Each offset becomes a node by reading the ANS-104 header at
   that place in the weave — one chunk, two when a header crosses a chunk
   boundary — with four in flight at a time and results streamed in page
   order.

Every step emits an event (`index.on(type, fn)` or `onEvent`), so a UI can
draw the work as it happens; `arlmdb-atlas` is one such UI.

## What it costs

Measured in three fresh sessions against the default index from arweave.net
(4 KiB pages, main tree depth 5). Ordinary bounded pages now generally finish
in under one second:

| | chunk GETs | wall |
| --- | --- | --- |
| open the index | 1 | 28–146 ms |
| one predicate, `count` | 8 | 143–180 ms |
| one-tag `first: 20`, cold | 10 | 171–196 ms |
| owner `first: 20`, cold | 19 | 288–313 ms |
| two-tag `first: 20`, cold | 34 | 411–1,028 ms |
| the same page again | 0 | 4–7 ms |

Chunks are retained for the session, so the branch pages every walk shares
are paid for once. A first uncached `tag=*` query is the exception: it must
discover the tag name's value subtrees and can take several seconds; repeats
reuse those chunks. These figures are observations, not a network-latency SLA.

## Byte sources

The gateway serves `/tx`, `/chunk` and `/block`; the fleet nodes the
container's `sources` tag names are tried, in order, for any chunk the
gateway lacks — arweave.net was missing roughly one chunk in six of this
container at the time of writing. Those nodes answer on plain HTTP
(`http://data-N.arweave.xyz:1984`, CORS `*`), which a page served over
HTTPS cannot reach unless the browser is told to allow it; the engine
reports the miss as `chunk:failed` and leaves the decision to the UI.

A read-ahead of the next chunk in walk direction can be issued after every
leaf read (`readAhead`, off by default — measured over five cold queries,
sixteen such chunks were fetched and one was ever read) and is reported as
such, so a renderer can draw it in its own colour.

## Tests

```
npm test            # offline: hashing vectors, addresses, the leapfrog over a fake and over a real 4 KiB fixture, the planner, buildQuery
npm run test:live   # against arweave.net: open (1 GET), two counts, a page cross-checked against arweave.net/graphql, an intersection, five ground-truth items located by their own tags
```
