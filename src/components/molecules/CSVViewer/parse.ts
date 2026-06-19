export function parseCSV(input: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let inQuotes = false;
	const csv = input.replace(/^\uFEFF/, '');

	for (let index = 0; index < csv.length; index++) {
		const character = csv[index];

		if (inQuotes) {
			if (character === '"' && csv[index + 1] === '"') {
				field += '"';
				index++;
			} else if (character === '"') {
				inQuotes = false;
			} else {
				field += character;
			}
			continue;
		}

		if (character === '"' && field.length === 0) {
			inQuotes = true;
		} else if (character === ',') {
			row.push(field);
			field = '';
		} else if (character === '\n' || character === '\r') {
			if (character === '\r' && csv[index + 1] === '\n') index++;
			row.push(field);
			rows.push(row);
			row = [];
			field = '';
		} else {
			field += character;
		}
	}

	if (field.length > 0 || row.length > 0 || csv.endsWith(',')) {
		row.push(field);
		rows.push(row);
	}

	return rows;
}
