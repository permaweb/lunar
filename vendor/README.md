# AO transport package

`ao.js-0.1.15.tgz` is the same MIT-licensed AO.js 0.1.15 package used by
`~/arc/repos/bazar`. It is checked in so installs do not depend on a sibling
checkout. The package includes its license and version-matched documentation.

Lunar uses an isolated route table for its configured read peers. PermawebOS's
injected transport is preferred when enabled; failed reads can fall back to the
local peer pool. Signed writes are not sent through the read failover transport.
