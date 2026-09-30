import React from 'react';

import { ViewWrapper } from 'app/styles';

import * as S from './styles';

export default function ViewTitle(props: {
	header: string;
	actions?: React.ReactNode[];
	headingLevel?: 'h1' | 'h2' | 'h3' | 'h4';
	id?: string;
	layout?: 'page' | 'section';
	variant?: 'default' | 'subsection';
}) {
	const Heading = props.headingLevel ?? 'h4';
	const content = (
		<S.HeaderContent $variant={props.variant ?? 'default'}>
			<Heading id={props.id}>{props.header}</Heading>
			{props.actions && (
				<S.HeaderActions>
					{props.actions.map((action: React.ReactNode, index: number) => (
						<React.Fragment key={index}>{action}</React.Fragment>
					))}
				</S.HeaderActions>
			)}
		</S.HeaderContent>
	);
	return (
		<S.HeaderWrapper $layout={props.layout ?? 'page'}>
			{props.layout === 'section' ? content : <ViewWrapper>{content}</ViewWrapper>}
		</S.HeaderWrapper>
	);
}
