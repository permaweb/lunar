import React from 'react';

import { Types } from '@permaweb/libs';

import { Loader } from 'components/atoms/Loader';
import { Editor } from 'components/molecules/Editor';
import { DEFAULT_ACTIONS, DEFAULT_MESSAGE_TAGS } from 'helpers/config';
import { getTxEndpoint } from 'helpers/endpoints';
import { checkValidAddress } from 'helpers/utils';
import { usePermawebProvider } from 'providers/PermawebProvider';

import * as S from './styles';

export default function ProcessSource(props: { processId: string; onBoot?: string }) {
	const permawebProvider = usePermawebProvider();

	const editorRef = React.useRef(null);
	const wrapperRef = React.useRef<HTMLDivElement>(null);

	const [src, setSrc] = React.useState<string | null>(null);
	const [editorKey, setEditorKey] = React.useState(0);

	React.useEffect(() => {
		(async function () {
			if (props.processId && checkValidAddress(props.processId)) {
				try {
					if (props.onBoot && checkValidAddress(props.onBoot)) {
						const srcResponse = await fetch(getTxEndpoint(props.onBoot));
						const rawSrc = await srcResponse.text();
						setSrc(rawSrc);
					} else {
						const gqlResponse = await permawebProvider.libs.getGQLData({
							tags: [...DEFAULT_MESSAGE_TAGS, { name: 'Action', values: [DEFAULT_ACTIONS.eval.name] }],
							recipients: [props.processId],
							sort: 'ascending',
						});

						if (gqlResponse?.data) {
							const sorted = [...gqlResponse.data]
								.slice()
								.sort((a: Types.GQLNodeResponseType, b: Types.GQLNodeResponseType) => {
									const aSize = Number(a.node.data.size);
									const bSize = Number(b.node.data.size);
									if (aSize < bSize) return 1;
									if (aSize > bSize) return -1;
									return 0;
								});

							const foundSrcTx = sorted[0].node.id;
							const srcResponse = await fetch(getTxEndpoint(foundSrcTx));
							const rawSrc = await srcResponse.text();
							setSrc(rawSrc);
						}
					}
				} catch (e: any) {
					console.error(e);
				}
			}
		})();
	}, [props.processId]);

	React.useEffect(() => {
		if (!src) return;

		const id = setTimeout(() => {
			editorRef.current?.scrollIntoView({
				behavior: 'smooth',
				block: 'start',
			});
		}, 10);

		return () => clearTimeout(id);
	}, [src]);

	// Force editor to remount when it becomes visible
	React.useEffect(() => {
		if (!src || !wrapperRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						// Component became visible, force editor to remount
						setEditorKey((prev) => prev + 1);
					}
				});
			},
			{ threshold: 0.1 }
		);

		observer.observe(wrapperRef.current);

		return () => observer.disconnect();
	}, [src]);

	return src ? (
		<S.Wrapper ref={wrapperRef}>
			<div ref={editorRef}>
				<Editor key={editorKey} initialData={src} language={'lua'} readOnly loading={!src} fixedHeight={900} />
			</div>
		</S.Wrapper>
	) : (
		<Loader sm relative />
	);
}
