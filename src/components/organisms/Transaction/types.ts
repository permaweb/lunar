import type { GQLNodeResponseType } from 'helpers/types';

export type ProcessMessagesViewProps = {
	processId: string;
	transaction: GQLNodeResponseType | null;
	isActive: boolean;
	onMessageOpen: (id: string) => void;
};
