export const PROCESS_ID = '_206v3RtEU-mvPIIu0gtPnBZ9SoS7MlxQn2Yk-kPzcU';
export const MESSAGE_ID = 'kSyBqHi6BSkSXKOZ8UZOzjtia4QixMkf60OCCQFBNVI';
export const SENDER = 'kRdpOYaT5pUUiNFDaUymqO1VcybZpAfNPnNdls-A134';

export const LEGACY_PROCESS_ID = '0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc';

/** SU201 nonce 1, read through su-router on 2026-11-08; public keys and signatures omitted. */
export const LEGACY_SCHEDULE_EDGE = {
	cursor: '1',
	node: {
		message: {
			id: 'lLVYh9BTvENZTtJMeXoKRa1y_f_uk2MQVeChUKl6Yec',
			owner: { address: 'geZphdOvGxzLyPbZgLgrADGHBVAZaidotlZkvIAQiYg' },
			data: "require('.process')._version",
			tags: [
				{ name: 'Action', value: 'Eval' },
				{ name: 'SDK', value: 'aoconnect' },
				{ name: 'Data-Protocol', value: 'ao' },
				{ name: 'Variant', value: 'ao.TN.1' },
				{ name: 'Type', value: 'Message' },
			],
			target: LEGACY_PROCESS_ID,
		},
		assignment: {
			tags: [
				{ name: 'Process', value: LEGACY_PROCESS_ID },
				{ name: 'Epoch', value: '0' },
				{ name: 'Nonce', value: '1' },
				{ name: 'Block-Height', value: '000001606001' },
				{ name: 'Timestamp', value: '1739055730628' },
			],
		},
	},
};

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
