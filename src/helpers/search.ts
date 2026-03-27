import { Types } from '@permaweb/libs';

import { addTransaction, selectTransaction } from 'store/transactions/reducer';

import { DEFAULT_GATEWAYS } from './config';
import { SearchTxArgs } from './types';
import { getTagValue, normalizeGqlResponse } from './utils';

const MAX_DEPTH = 10;

function cacheTransaction(
	response: Types.GQLNodeResponseType,
	args: SearchTxArgs,
	opts?: { skipBlockHeightCheck: boolean }
) {
	if (args.store && args.dispatch) {
		if (opts?.skipBlockHeightCheck || response?.node?.block) {
			args.dispatch(addTransaction(args.txId, response));
		}
	}
}

export async function searchTxById(args: SearchTxArgs, depth: number = 0): Promise<Types.GQLNodeResponseType> {
	if (args.store) {
		const cached = selectTransaction(args.store.getState(), args.txId);
		if (cached) {
			return cached;
		}
	}
	try {
		let response = await args.getGQLData({
			id: [args.txId],
		});

		if (!response.data?.length || response.data?.length <= 0) {
			response = await args.getGQLData({
				gateway: DEFAULT_GATEWAYS.fallback,
				id: [args.txId],
			});
		}

		response = await normalizeGqlResponse(response);

		const responseData = response?.data?.[0];

		if (!responseData) {
			/* Check if this is a wallet based on activity */
			try {
				const activityResponse = await args.getGQLData({
					owners: [args.txId],
				});

				if (activityResponse?.data?.length > 0) {
					const walletResponse = {
						cursor: null,
						node: {
							id: args.txId,
							tags: [{ name: 'Type', value: 'Wallet' }],
							data: null,
							owner: {
								address: null,
							},
							block: {
								height: null,
								timestamp: null,
							},
						},
					};

					cacheTransaction(walletResponse as Types.GQLNodeResponseType, args, { skipBlockHeightCheck: true });
				}
			} catch (e: any) {
				console.error(e);
			}

			return null;
		}

		/* Filter pushed messages by checking the authority */
		const fromProcess = getTagValue(responseData.node?.tags, 'From-Process');
		const messageOwner = responseData.node?.owner?.address;

		// No authority check needed
		if (!fromProcess || !messageOwner) {
			cacheTransaction(responseData, args);
			return responseData;
		}

		// Prevent infinite recursion
		if (depth >= MAX_DEPTH) {
			console.warn(`Max depth ${MAX_DEPTH} reached when searching for tx ${args.txId}`);
			return responseData;
		}

		try {
			const fromProcessResponse = await searchTxById(
				{
					txId: fromProcess,
					getGQLData: args.getGQLData,
					store: args.store,
					dispatch: args.dispatch,
				},
				depth + 1
			);

			const fromProcessAuthority = getTagValue(fromProcessResponse?.node?.tags, 'Authority');

			// Reject if authority doesn't match owner
			if (fromProcessAuthority && fromProcessAuthority !== messageOwner) {
				return null;
			}

			cacheTransaction(responseData, args);
			return responseData;
		} catch (e: any) {
			console.error(e);
			return responseData;
		}
	} catch (e: any) {
		throw new Error(e);
	}
}
