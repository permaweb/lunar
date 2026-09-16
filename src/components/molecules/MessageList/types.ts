import React from 'react';

import type { GQLNodeResponseType, TagType } from 'helpers/types';

export type MessageListEntry = Omit<GQLNodeResponseType, 'node'> & {
	node: Omit<GQLNodeResponseType['node'], 'block'> & {
		block?: { height: number; timestamp?: number };
	};
	display?: {
		typeLabel?: string;
		actionLabel?: string;
		time?: React.ReactNode;
		input?: unknown;
		details?: TagType[];
	};
};

export type MessageListSource = {
	edges: MessageListEntry[];
	loading: boolean;
	page: number;
	pageSize: number;
	totalCount: number | null;
	canReadResults: boolean;
	loadingMessage?: string;
	emptyMessage?: string;
	timeLabel?: string;
	error?: string;
	onPageChange: (page: number) => void;
	onRefresh: () => void;
	onRetry: () => void;
};
