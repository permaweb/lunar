export const device_actions = [
	{
		id: 'meta',
		label: 'meta@1.0',
		baseUrl: '~meta@1.0/',
		actions: {
			info: {
				method: 'POST',
				url: 'info',
				description: 'Post json to the meta info',
				params: [
					{
						name: 'server',
						type: 'server',
					},
					{
						name: 'config',
					},
				],
			},
			g_info: {
				method: 'GET',
				url: 'info/format~hyperbuddy@1.0',
				description: 'Get data from meta info',
				params: [
					{
						name: 'server',
						type: 'server',
					},
					{
						name: 'config',
					},
				],
			},
		},
	},
	{
		id: 'greenzone',
		label: 'greenzone@1.0',
		baseUrl: '~greenzone@1.0/',
		actions: {
			init: {
				method: 'GET',
				url: 'init',
				description: 'Initialize the greenzone',
				params: [
					{
						name: 'server',
						type: 'server',
					},
				],
			},
			join: {
				method: 'GET',
				url: 'join',
				description: 'Join the greenzone',
				params: [
					{
						name: 'server',
						type: 'server',
					},
				],
			},
			become: {
				method: 'GET',
				url: 'become',
				description: 'Become a greenzone peer',
				params: [
					{
						name: 'server',
						type: 'server',
					},
				],
			},
		},
	},
];
