# AR LMDB source provenance

Source: `arweave://arlmdb.js`, commit `0d41414e202d1ceb586b190ce40ad180921b84b5`.
Copied from the user-supplied checkout on September 4, 2026.

Every file under `src/`, plus `README.md` and `API.md`, is copied from that
revision without changing behavior. The package manifest pins GraphQL to
16.11.0 and resolves the compatible LMDB reader from `../lmdb-wasm` so a
fresh Lunar checkout does not depend on a machine-specific source path.
The supplied private package has no license file or license declaration;
no additional license is asserted here.

`README.md` and `API.md` are upstream documents. Some statements lag the
source: this revision supports unions of multiple tag values, owners,
recipients and bundle filters. The implementation is authoritative.

The default index is `oWRzBr3KHhULAL-s5ULeXac1mb_WQOX5uFBRea16iRI`, as used
by the reference dashboard at <https://391283911206kb.arweave.net/>.
It indexes ANS-104 items through block 1,988,355. It does not index item IDs
or L1 transactions. Queries require a tag, owner, recipient or bundle
predicate; root aliases, fragments and multiple root selections are not
supported. Each page is limited to 50 results. Result `block` and
`bundledIn` fields are null. Counts with multiple predicates or a block
window are bounded walks (the default limit is 1,000), not guaranteed
exact totals.

The reader fetches index placement and chunks from an Arweave gateway.
Local GraphQL execution still requires network access for those bytes.
Upstream's default fleet sources use HTTP; consumers served over HTTPS
must configure suitable HTTPS sources or deliberately handle unavailable
chunks. Query cancellation is cooperative; applications should also
bound individual byte-fetch requests and ignore superseded results.

See `../lmdb-wasm/UPSTREAM.md` for the compatible reader's provenance.
