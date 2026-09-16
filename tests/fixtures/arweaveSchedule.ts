export const PROCESS_ID = '_206v3RtEU-mvPIIu0gtPnBZ9SoS7MlxQn2Yk-kPzcU';
export const MESSAGE_ID = 'kSyBqHi6BSkSXKOZ8UZOzjtia4QixMkf60OCCQFBNVI';
export const SENDER = 'kRdpOYaT5pUUiNFDaUymqO1VcybZpAfNPnNdls-A134';

export function assignment(slot: number, processId = PROCESS_ID) {
	return {
		process: processId,
		slot,
		'block-height': 1995392 + slot * 5,
		'block-index': slot === 0 ? 9 : 0,
		body: {
			...(slot === 0 ? { device: 'process@1.0' } : { action: 'make-offer', target: processId }),
			'offer-quantity': '6000000000000000000',
			commitments: {
				['h'.repeat(43)]: { 'commitment-device': 'httpsig@1.0' },
				[slot === 0 ? processId : MESSAGE_ID]: { 'commitment-device': 'tx@1.0', committer: SENDER },
			},
		},
	};
}

export function assignments(from: number, to: number, processId = PROCESS_ID) {
	return {
		...Object.fromEntries(
			Array.from({ length: to - from + 1 }, (_, index) => [from + index, assignment(from + index, processId)])
		),
		status: 200,
		commitments: {},
	};
}
