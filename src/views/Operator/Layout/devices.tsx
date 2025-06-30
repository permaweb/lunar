export const devices = [
	{
		id: 'snp',
		label: 'snp@1.0',
		configuration: {
			snp_trusted: {
				type: 'array',
				description: 'The trusted nodes for the snp',
				size: 'full',
				items: {
					kernel: {
						type: 'string',
						description: 'The kernel for the snp',
						placeholder: '69d0cd7d13858e4fcef6bc7797aebd258730f215bc5642c4ad8e4b893cc67576',
						size: 'half',
						length: 64,
					},
					initrd: {
						type: 'string',
						description: 'The initrd for the snp',
						placeholder: '25db516e76258ca7d16e8979f59e3a188ba16f80c99a5fde97d146012cfa09c6',
						size: 'half',
						length: 64,
					},
					append: {
						type: 'string',
						description: 'The append for the snp',
						placeholder: 'c9048ef842d4081bad12685d75bd0deb0079e66d87dade3ecab02f8ee1b8c671',
						size: 'half',
						length: 64,
					},
					firmware: {
						type: 'string',
						description: 'The firmware for the snp',
						placeholder:
							'b8c5d4082d5738db6b0fb0294174992738645df70c44cdecf7fad3a62244b788e7e408c582ee48a74b289f3acec78510',
						size: 'half',
						length: 96,
					},
					vcpus: {
						type: 'number',
						description: 'The vcpus for the snp',
						placeholder: '42',
						size: 'quarter',
						min_value: 0,
					},
					vcpu_type: {
						type: 'number',
						description: 'The vcpu type for the snp',
						placeholder: '5',
						size: 'quarter',
						min_value: 0,
					},
					vmm_type: {
						type: 'number',
						description: 'The vmm type for the snp',
						placeholder: '1',
						size: 'quarter',
						min_value: 0,
					},
					guest_features: {
						type: 'number',
						description: 'The guest features for the snp',
						placeholder: '1',
						size: 'quarter',
						min_value: 0,
					},
				},
			},
		},
	},
	{
		id: 'greenzone',
		label: 'greenzone@1.0',
		configuration: {
			green_zone_required_config: {
				type: 'json',
				description: 'The required configuration for the green zone',
				size: 'full',
			},
			green_zone_peer_location: {
				type: 'string',
				description: 'The location of the green zone peer',
				placeholder: 'https://greenzone.forward.computer',
				size: 'half',
			},
			green_zone_peer_id: {
				type: 'string',
				description: 'The id of the green zone peer',
				placeholder: 'SgzHpKaXKtTY9FIeP4yRvgifMa3umJQwZHiheAkSa9w',
				size: 'half',
				length: 43,
			},
		},
	},
];
