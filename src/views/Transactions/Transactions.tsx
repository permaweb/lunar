import { ViewWrapper } from 'app/styles';
import { TransactionList } from 'components/molecules/TransactionList';
import { ViewTitle } from 'components/molecules/ViewTitle';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function Transactions() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	return (
		<S.Wrapper>
			<ViewTitle header={language.transactions} />
			<ViewWrapper>
				<TransactionList mode={'recent'} header={language.recentTransactions} />
			</ViewWrapper>
		</S.Wrapper>
	);
}
