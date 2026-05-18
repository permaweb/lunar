import React from 'react';

export interface IProps {
	type?: 'modal' | 'panel';
	header: string | null | undefined;
	handleClose: () => void | null;
	children: React.ReactNode;
	allowOverflow?: boolean;
	width?: number;
	closeHandlerDisabled?: boolean;
}
