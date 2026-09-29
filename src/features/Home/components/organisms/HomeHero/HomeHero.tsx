import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import { getArweaveNodeRoute, normalizeArweaveNode } from 'helpers/arweaveNode';
import { ASSETS, URLS } from 'helpers/config';
import { isValidSearchInput } from 'helpers/searchInput';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { LunarBackdrop } from '../LunarBackdrop';

import * as S from './styles';

export default function HomeHero() {
	const navigate = useNavigate();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const [query, setQuery] = React.useState('');
	const [hasSubmitted, setHasSubmitted] = React.useState(false);
	const isValid = isValidSearchInput(query);

	function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setHasSubmitted(true);
		if (!isValid) return;
		const input = query.trim();
		const node = normalizeArweaveNode(input);
		navigate(node ? getArweaveNodeRoute(node) : `${URLS.explorer}${encodeURIComponent(input)}`);
	}

	return (
		<S.Wrapper aria-labelledby="home-title">
			<LunarBackdrop />
			<S.Content>
				<h1 id="home-title">{language.landing.title}</h1>
				<S.Search role="search" aria-label={language.landing.searchPlaceholder} onSubmit={handleSubmit}>
					<FormField
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setHasSubmitted(false);
						}}
						placeholder={language.landing.searchPlaceholder}
						icon={ASSETS.search}
						invalid={{ status: hasSubmitted && !isValid, message: null }}
						disabled={false}
						hideErrorMessage
						endAdornment={
							<Button
								type="alt1"
								icon={ASSETS.arrowRight}
								tooltip={language.search}
								onPress={() => {}}
								formSubmit
								height={32}
								iconSize={16}
							/>
						}
					/>
					{hasSubmitted && !isValid && <S.Error role="alert">{language.landing.searchError}</S.Error>}
				</S.Search>
				<S.Examples>{language.landing.searchExamples}</S.Examples>
			</S.Content>
		</S.Wrapper>
	);
}
