import React from 'react';

import { Button } from 'components/atoms/Button';
import { Disclosure } from 'components/atoms/Disclosure';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

type Content = { status: 'idle' | 'loading' | 'error' } | { status: 'ready'; value: unknown };

export default function JSONLinkedValue(props: {
	id: string;
	onLoad: (id: string, signal: AbortSignal) => Promise<unknown>;
	onRender: (value: unknown) => React.ReactNode;
	blocked?: 'cycle' | 'depth';
}) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const scope = React.useMemo(() => ({ id: props.id, onLoad: props.onLoad }), [props.id, props.onLoad]);
	const [isOpen, setIsOpen] = React.useState(false);
	const [revision, setRevision] = React.useState(0);
	const [snapshot, setSnapshot] = React.useState<{ scope: typeof scope; content: Content }>({
		scope,
		content: { status: 'idle' },
	});
	const content: Content = snapshot.scope === scope ? snapshot.content : { status: 'idle' };

	React.useEffect(() => {
		if (!isOpen || props.blocked || content.status === 'ready') return;
		const controller = new AbortController();
		setSnapshot({ scope, content: { status: 'loading' } });
		Promise.resolve()
			.then(() => props.onLoad(props.id, controller.signal))
			.then(
				(value) => {
					if (!controller.signal.aborted) setSnapshot({ scope, content: { status: 'ready', value } });
				},
				() => {
					if (!controller.signal.aborted) setSnapshot({ scope, content: { status: 'error' } });
				}
			);
		return () => controller.abort();
	}, [scope, isOpen, revision, props.blocked]);

	return (
		<S.Wrapper>
			<Disclosure label={<S.Label>{`"${props.id}" · ${language.expandLinkedValue}`}</S.Label>} onToggle={setIsOpen}>
				{!isOpen ? null : props.blocked ? (
					<S.Status role="status">
						{props.blocked === 'cycle' ? language.linkedStateCycle : language.linkedStateDepth}
					</S.Status>
				) : content.status === 'ready' ? (
					props.onRender(content.value)
				) : content.status === 'error' ? (
					<S.Status role="alert">
						<span>{language.aoReadUnavailable}</span>
						<Button type="alt3" label={language.retry} onPress={() => setRevision((value) => value + 1)} />
					</S.Status>
				) : (
					<S.Status role="status">{language.loadingLinkedState}</S.Status>
				)}
			</Disclosure>
		</S.Wrapper>
	);
}
