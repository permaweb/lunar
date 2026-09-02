import React from 'react';

export interface IProps {
	type?: 'modal' | 'panel';
	header: string | null | undefined;
	onClose: () => void | null;
	children: React.ReactNode;
	allowOverflow?: boolean;
	width?: number;
	closeHandlerDisabled?: boolean;
}
