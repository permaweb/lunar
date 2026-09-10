"""Convert a DB-IP Lite country CSV download to Lunar's static IPv4 lookup asset.

Usage: python3 scripts/update-node-country-data.py 2026-09 /path/to/download.csv.gz
Download the named release from https://db-ip.com/db/download/ip-to-country-lite.
This is a maintenance tool, never part of the app's build or runtime.
"""

import csv
import gzip
import hashlib
import ipaddress
import json
from pathlib import Path
import re
import struct
import sys


def convert(release, source):
    if not re.fullmatch(r"\d{4}-(0[1-9]|1[0-2])", release):
        raise ValueError("Use a YYYY-MM release")
    ranges = []
    next_start = 0
    with gzip.open(source, "rt", encoding="utf-8", newline="") as stream:
        for start, end, country in csv.reader(stream):
            if ":" in start:
                continue
            first, last = int(ipaddress.IPv4Address(start)), int(ipaddress.IPv4Address(end))
            if first != next_start or last < first or not re.fullmatch(r"[A-Z]{2}", country):
                raise ValueError("Expected ordered, contiguous IPv4 ranges and country codes")
            next_start = last + 1
            if ranges and ranges[-1][1] == country:
                ranges[-1] = (last, country)
            else:
                ranges.append((last, country))
    if next_start != 2**32:
        raise ValueError("Database does not cover all IPv4 addresses")
    countries = sorted({country for _, country in ranges})
    if len(countries) > 256:
        raise ValueError("Country table exceeds format capacity")
    indexes = {country: index for index, country in enumerate(countries)}
    payload = bytearray(b"LNC1" + struct.pack("<HI", len(countries), len(ranges)))
    payload.extend("".join(countries).encode("ascii"))
    for end, country in ranges:
        payload.extend(struct.pack("<IB", end, indexes[country]))
    if len(payload) > 2_000_000:
        raise ValueError("Country asset exceeds the configured 2 MB budget")
    destination = Path(__file__).resolve().parents[1] / "src/api/nodes/data"
    destination.mkdir(parents=True, exist_ok=True)
    metadata = {
        "provider": "DB-IP",
        "release": release,
        "sourceUrl": f"https://download.db-ip.com/free/dbip-country-lite-{release}.csv.gz",
        "sourceSha256": hashlib.sha256(Path(source).read_bytes()).hexdigest(),
        "license": "CC BY 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
        "attributionUrl": "https://db-ip.com",
        "format": "LNC1",
        "records": len(ranges),
        "bytes": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "changes": "IPv4 only; adjacent ranges for the same country merged; compact binary encoding.",
    }
    (destination / "ipv4-country.bin").write_bytes(payload)
    (destination / "metadata.json").write_text(json.dumps(metadata, indent="\t") + "\n")
    print(f"Wrote {len(ranges):,} ranges, {len(payload):,} bytes ({release})")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    convert(sys.argv[1], sys.argv[2])
