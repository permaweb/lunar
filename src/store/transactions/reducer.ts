import { Types } from '@permaweb/libs';

// Action types
export const ADD_TRANSACTION = 'ADD_TRANSACTION';
export const GET_TRANSACTION = 'GET_TRANSACTION';

interface AddTransactionAction {
	type: typeof ADD_TRANSACTION;
	payload: {
		id: string;
		data: Types.GQLNodeResponseType;
	};
}

interface GetTransactionAction {
	type: typeof GET_TRANSACTION;
	payload: string;
}

export type TransactionActionTypes = AddTransactionAction | GetTransactionAction;

export interface TransactionState {
	[id: string]: Types.GQLNodeResponseType;
}

const initialState: TransactionState = {};

export default function transactionReducer(state = initialState, action: TransactionActionTypes): TransactionState {
	switch (action.type) {
		case ADD_TRANSACTION:
			return {
				...state,
				[action.payload.id]: action.payload.data,
			};
		default:
			return state;
	}
}

export const addTransaction = (id: string, data: Types.GQLNodeResponseType): AddTransactionAction => ({
	type: ADD_TRANSACTION,
	payload: { id, data },
});

export const getTransaction = (id: string): GetTransactionAction => ({
	type: GET_TRANSACTION,
	payload: id,
});

export const selectTransaction = (state: { transactions: TransactionState }, id: string) => {
	return state.transactions[id] || null;
};
