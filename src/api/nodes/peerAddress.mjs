// Arweave's peer API advertises IPv4:port endpoints. Never accept URLs or hosts.
export function parsePeerAddress(value) {
	if (typeof value !== 'string') return null;
	const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3}):(\d{1,5})$/.exec(value);
	if (!match) return null;
	const octets = match.slice(1, 5).map(Number);
	const port = Number(match[5]);
	if (octets.some((part, index) => part > 255 || String(part) !== match[index + 1])) return null;
	const [a, b, c] = octets;
	if (
		port < 1 ||
		port > 65535 ||
		a === 0 ||
		a === 10 ||
		a === 127 ||
		a >= 224 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && (b === 168 || b === 0)) ||
		(a === 192 && b === 88 && c === 99) ||
		(a === 198 && (b === 18 || b === 19)) ||
		(a === 198 && b === 51 && c === 100) ||
		(a === 203 && b === 0 && c === 113)
	)
		return null;
	const ip = octets.join('.');
	return { address: `${ip}:${port}`, ip, port };
}
