import React from 'react';

type URLViewType = {
	label: string;
	disabled: boolean;
	url: any;
	icon: string;
	view?: React.ComponentType;
	content?: React.ReactNode;
};

export interface ITProps {
	label: string;
	icon: string | null;
	disabled: boolean;
	active: boolean;
	onPress: (url: string) => void;
	url: string;
}

export interface ICProps {
	tabs: URLViewType[];
	activeUrl: string;
}

export interface IUProps {
	tabs: URLViewType[];
	activeUrl: string;
	useFixed?: boolean;
	noUrlCopy?: boolean;
	endComponent?: React.ReactNode;
	isParentActive?: boolean;
}
