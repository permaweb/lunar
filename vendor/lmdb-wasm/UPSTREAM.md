# LMDB reader provenance

This is the compatible LMDB reader embedded in the user-provided dashboard:

<https://391283911206kb.arweave.net/>

Dashboard HTML SHA-256:
`834ec59aae86439244c28a16efd5e277c8a92c8ddaa391ee87f7284b77a5e565`.
Retrieved September 4, 2026.

The supplied AR LMDB checkout requires the reader's 0.4 API (`CursorOp`,
`LmdbDb.cursor()` and cursor `op`/`value`). The available
`arweave://lmdb-wasm` HEAD, `67bf17aefd0e95fa3d4fec1e94de5964f144ed42`, is
0.3 and lacks those APIs. The compatible reader is therefore preserved as
an exact compiled artifact from the reference dashboard, rather than
reimplementing its cursor or WebAssembly code. The 0.4 version matches the
dependency recorded in the supplied AR LMDB lockfile.

`index.js` contains only the dashboard's LMDB module and the bootstrap
helpers it requires. Acorn parses the last inline script; the five
top-level declarations named `$`, `gr`, `mI`, `yI` and `Xn` are copied
verbatim and in their original order. A comment and a public ES module
export facade are added. No query code, visualizer, DOM bootstrap, remote
imports or dashboard fallback engine is included.

`verify-dashboard.mjs` repeats that extraction in memory, checks the
dashboard's content hash and compares the result byte-for-byte with the
vendored runtime. Run from an installed Lunar checkout:

```sh
node vendor/lmdb-wasm/verify-dashboard.mjs
```

The reader contains its compiled WebAssembly bytes as base64, exactly as
the dashboard does. There is no `.wasm` network fetch, worker URL or
deployment-relative asset path to configure. The module uses WebAssembly,
`atob`, typed arrays and browser fetch for byte sources. Import it through
the AR LMDB API adapter so application startup can load it lazily.

The MIT license and LMDB/OpenLDAP/Emscripten notices are copied unchanged
from `arweave://lmdb-wasm` commit
`67bf17aefd0e95fa3d4fec1e94de5964f144ed42`, under `LICENSE` and `licenses/`.
No package install hook or runtime download is needed. Lunar installs both
vendored packages from relative `file:vendor/...` dependencies.
