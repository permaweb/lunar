import { ViewWrapper } from 'app/styles';
import { BlockList } from 'components/molecules/BlockList';
import { ViewTitle } from 'components/molecules/ViewTitle';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function Blocks() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	return (
		<S.Wrapper>
			<ViewTitle header={language.blocks} />
			<ViewWrapper>
				<BlockList header={language.recentBlocks} />
			</ViewWrapper>
		</S.Wrapper>
	);
}
