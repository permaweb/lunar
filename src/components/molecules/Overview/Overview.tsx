import React from 'react';

import * as S from './styles';

export default function Overview(props: { title: string; fields: { label: string; value: React.ReactNode }[] }) {
	return (
		<S.MessageInfo className={'border-wrapper-primary'}>
			<S.MessageInfoHeader>
				<p>{props.title}</p>
			</S.MessageInfoHeader>
			<S.MessageInfoBody $desktopItemCount={props.fields.length}>
				{props.fields.map((field) => (
					<S.MessageInfoLine key={field.label}>
						<span>{`${field.label}: `}</span>
						<S.TxOverviewValue>
							{typeof field.value === 'string' ? <p>{field.value}</p> : field.value}
						</S.TxOverviewValue>
					</S.MessageInfoLine>
				))}
			</S.MessageInfoBody>
		</S.MessageInfo>
	);
}
