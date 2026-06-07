import { ViewWrapper } from 'app/styles';
import { ViewHeader } from 'components/atoms/ViewHeader';
import { BlockList } from 'components/molecules/BlockList';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function Blocks() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	return (
		<S.Wrapper>
			<ViewHeader header={language.blocks} />
			<ViewWrapper>
				<BlockList header={language.recentBlocks} />
			</ViewWrapper>
		</S.Wrapper>
	);
}
