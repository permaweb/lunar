import React from 'react';

export type SummaryPanelItem = {
	id: string;
	label?: string;
	value: React.ReactNode;
	/** Draws the separator after this item when another item follows it. Defaults to true. */
	hasDivider?: boolean;
};

export type SummaryPanelRow = {
	id: string;
	items: SummaryPanelItem[];
};
