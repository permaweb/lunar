import { useNavigate } from 'react-router-dom';

import { Button } from 'components/atoms/Button';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function NotFound() {
	const navigate = useNavigate();

	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	return (
		<S.Wrapper>
			<S.Content>
				<S.Header>404</S.Header>
				<S.Divider />
				<S.Message>{language.pageNotFound}</S.Message>
			</S.Content>
			<Button type={'primary'} label={language.goBack} onPress={() => navigate(-1)} height={40} width={150} />
		</S.Wrapper>
	);
}
