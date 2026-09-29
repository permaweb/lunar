import React from 'react';

import { GQLEdge, TransactionNode } from 'api/blocks';

export type TransactionListEntry = GQLEdge<TransactionNode> & {
	display?: {
		identifier?: string | number;
		typeLabel?: string;
		typeColor?: string;
		detail?: string;
		time?: React.ReactNode;
	};
};
