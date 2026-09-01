import React from 'react';

export type ExplorerLinkType = 'address' | 'transaction' | 'block';

export interface ExplorerLinkProps {
	value: string | number | null | undefined;
	type?: ExplorerLinkType;
	label?: React.ReactNode;
	nameMaxLength?: number;
	wrap?: boolean;
	viewIcon?: string;
	showIcon?: boolean;
	tooltipPosition?: string;
	handlePress?: () => void;
}

export interface IProps {
	address: string;
	nameMaxLength?: number;
	wrap?: boolean;
	view?: boolean;
	viewIcon?: string;
	tooltipPosition?: string;
	handlePress?: () => void;
}
