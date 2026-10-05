import React from 'react';

import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function MessageInput(props: {
	tags: React.ReactNode;
	data: React.ReactNode;
	className?: string;
	headerVariant?: 'compact' | 'section';
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	return (
		<S.Wrapper
			className={props.className}
			aria-label={language.inputTagsAndData}
			$sectionHeader={props.headerVariant === 'section'}
		>
			<S.Header $sectionHeader={props.headerVariant === 'section'}>
				<p>{language.input}</p>
				<span>{language.inputTagsAndDataSubtitle}</span>
			</S.Header>
			<S.Columns>
				<S.Tags>{props.tags}</S.Tags>
				<S.Data>{props.data}</S.Data>
			</S.Columns>
		</S.Wrapper>
	);
}
