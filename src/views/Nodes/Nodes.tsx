import { ViewTitle } from 'components/molecules/ViewTitle';
import { NodesTable } from 'features/Nodes';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function Nodes() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	return (
		<S.Wrapper>
			<ViewTitle header={language.nodes} headingLevel={'h1'} />
			<S.Content>
				<NodesTable />
			</S.Content>
		</S.Wrapper>
	);
}
