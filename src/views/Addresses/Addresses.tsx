import { ViewWrapper } from 'app/styles';
import { ViewTitle } from 'components/molecules/ViewTitle';
import { AddressList } from 'features/Addresses';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function Addresses() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	return (
		<S.Wrapper>
			<ViewTitle header={language.addresses} />
			<ViewWrapper>
				<AddressList />
			</ViewWrapper>
		</S.Wrapper>
	);
}
