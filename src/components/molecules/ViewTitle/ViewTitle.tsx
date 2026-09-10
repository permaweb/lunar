import React from 'react';

import { ViewWrapper } from 'app/styles';

import * as S from './styles';

export default function ViewTitle(props: { header: string; actions?: React.ReactNode[]; headingLevel?: 'h1' | 'h4' }) {
	const Heading = props.headingLevel ?? 'h4';
	return (
		<S.HeaderWrapper>
			<ViewWrapper>
				<S.HeaderContent>
					<Heading>{props.header}</Heading>
					{props.actions && (
						<S.HeaderActions>
							{props.actions.map((action: React.ReactNode, index: number) => (
								<React.Fragment key={index}>{action}</React.Fragment>
							))}
						</S.HeaderActions>
					)}
				</S.HeaderContent>
			</ViewWrapper>
		</S.HeaderWrapper>
	);
}
