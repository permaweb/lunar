import React from 'react';

import { OverviewStyles as O } from 'components/molecules/Overview';

import * as S from './styles';
import type { SummaryPanelRow } from './types';

export default function SummaryPanel(props: {
	title: string;
	subject?: { label: string; value: React.ReactNode };
	rows: SummaryPanelRow[];
}) {
	return (
		<S.Wrapper className={'border-wrapper-alt3'}>
			<S.Header>
				<p>{props.title}</p>
				{props.subject && (
					<O.MessageInfoID>
						<span>{`${props.subject.label}: `}</span>
						{props.subject.value}
					</O.MessageInfoID>
				)}
			</S.Header>
			{props.rows.length > 0 && (
				<S.Body>
					{props.rows.map((row) => (
						<S.Line key={row.id}>
							{row.items.map((item) => (
								<S.LineElement key={item.id} $hasDivider={item.hasDivider !== false}>
									{item.label && <span>{`${item.label}: `}</span>}
									{item.value}
								</S.LineElement>
							))}
						</S.Line>
					))}
				</S.Body>
			)}
		</S.Wrapper>
	);
}
