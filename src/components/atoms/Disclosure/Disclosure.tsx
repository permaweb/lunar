import React from 'react';

import { Chevron } from 'components/atoms/Chevron';

import * as S from './styles';

export default function Disclosure(props: {
	label: React.ReactNode;
	children: React.ReactNode;
	onToggle?: (isOpen: boolean) => void;
}) {
	const [isOpen, setIsOpen] = React.useState(false);

	function handleToggle(event: React.SyntheticEvent<HTMLDetailsElement>) {
		setIsOpen(event.currentTarget.open);
		props.onToggle?.(event.currentTarget.open);
	}

	return (
		<S.Wrapper onToggle={handleToggle}>
			<S.Summary>
				<Chevron isOpen={isOpen} variant="disclosure" />
				{props.label}
			</S.Summary>
			<S.Content>{props.children}</S.Content>
		</S.Wrapper>
	);
}
