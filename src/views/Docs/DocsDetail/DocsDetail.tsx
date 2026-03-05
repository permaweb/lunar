import { DocsNavigation } from './DocsNavigation';
import { DocsNavigationFooter } from './DocsNavigationFooter';
import { DocTemplate } from './DocTemplate';
import * as S from './styles';

export default function DocsDetail() {
	return (
		<S.Wrapper>
			<S.BodyWrapper>
				<DocsNavigation />
				<S.ContentWrapper>
					<DocTemplate />
					<DocsNavigationFooter />
				</S.ContentWrapper>
			</S.BodyWrapper>
		</S.Wrapper>
	);
}
