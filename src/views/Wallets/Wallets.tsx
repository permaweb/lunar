import { useSearchParams } from 'react-router-dom';

import { ViewWrapper } from 'app/styles';
import { Toggle } from 'components/atoms/Toggle';
import { ViewTitle } from 'components/molecules/ViewTitle';
import { AddressList, TokenHolders } from 'features/Wallets';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function Wallets() {
	const [searchParams, setSearchParams] = useSearchParams();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const network = searchParams.get('network') === 'ao' ? 'ao' : 'arweave';

	function handleNetworkChange(value: 'arweave' | 'ao') {
		const next = new URLSearchParams(searchParams);
		if (value === 'ao') next.set('network', 'ao');
		else next.delete('network');
		setSearchParams(next);
	}

	return (
		<S.Wrapper>
			<ViewTitle
				header={language.landing.wallets}
				headingLevel="h1"
				actions={[
					<Toggle
						label={language.network}
						value={network}
						options={[
							{ value: 'arweave', label: language.arweave },
							{ value: 'ao', label: language.landing.ao },
						]}
						onChange={handleNetworkChange}
					/>,
				]}
			/>
			<ViewWrapper>{network === 'ao' ? <TokenHolders /> : <AddressList />}</ViewWrapper>
		</S.Wrapper>
	);
}
