import { type AoCoreState } from 'api/aoCore';

import { Button } from 'components/atoms/Button';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { AoCoreFields } from '../../molecules/AoCoreFields';

import * as S from './styles';

export default function AoCoreInfo(props: { state: AoCoreState; onRetry: () => void }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current].aoCore;
	if (props.state.status === 'idle' || props.state.status === 'loading') {
		return (
			<S.Wrapper>
				<AoCoreFields label={language.fields} ancestors={[]} loadingMessage={language.loading} />
			</S.Wrapper>
		);
	}
	if (props.state.status !== 'ready') {
		return (
			<S.Wrapper>
				<S.Card aria-live="polite" className={'border-wrapper-alt3'}>
					<h3>{language.title}</h3>
					<p>{props.state.status === 'error' ? language.errors[props.state.code] : language.unrecognized}</p>
					{props.state.status === 'error' && <Button type="alt1" label={language.retry} onPress={props.onRetry} />}
				</S.Card>
			</S.Wrapper>
		);
	}
	const result = props.state.result;
	const data = result.data;
	return (
		<S.Wrapper>
			<AoCoreFields
				key={data.requestedId}
				value={data.message}
				label={language.fields}
				ancestors={[data.requestedId]}
			/>
		</S.Wrapper>
	);
}
