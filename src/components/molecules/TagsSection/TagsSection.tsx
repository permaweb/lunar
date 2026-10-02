import React from 'react';

import { CopyableValue } from 'components/atoms/CopyableValue';
import { TxAddress } from 'components/atoms/TxAddress';
import { checkValidAddress } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function TagsSection(props: {
	tags: { name: string; value: string }[] | null;
	title?: string;
	fixedHeight?: number;
	showCount?: boolean;
	compact?: boolean;
	embedded?: boolean;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const listRef = React.useRef<HTMLDivElement | null>(null);
	const [hasOverflow, setHasOverflow] = React.useState(false);
	const tags = React.useMemo(
		() =>
			[...(props.tags ?? [])].sort(
				(a, b) =>
					a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
					a.value.localeCompare(b.value, undefined, { sensitivity: 'base' })
			),
		[props.tags]
	);

	React.useEffect(() => {
		const element = listRef.current;
		if (!element) return;
		const scrollElement = element.closest<HTMLElement>('.scroll-wrapper') ?? element;
		function updateOverflowState() {
			setHasOverflow(scrollElement.scrollHeight > scrollElement.clientHeight);
		}
		updateOverflowState();
		if (typeof ResizeObserver === 'undefined') {
			window.addEventListener('resize', updateOverflowState);
			return () => window.removeEventListener('resize', updateOverflowState);
		}
		const observer = new ResizeObserver(updateOverflowState);
		observer.observe(element);
		if (scrollElement !== element) observer.observe(scrollElement);
		return () => observer.disconnect();
	}, [props.fixedHeight, props.embedded, tags]);

	return (
		<S.Wrapper
			className={props.embedded ? undefined : 'border-wrapper-alt3'}
			$fixedHeight={props.fixedHeight}
			$embedded={props.embedded}
			aria-label={props.title ?? language.tags}
		>
			{!props.embedded && (
				<S.Header $compact={props.compact}>
					<h3>{props.title ?? language.tags}</h3>
					{props.showCount !== false && <span>({props.tags ? tags.length : '-'})</span>}
				</S.Header>
			)}
			<S.List
				ref={listRef}
				$fixedHeight={props.fixedHeight}
				$hasOverflow={hasOverflow}
				$hasDividers={!props.embedded}
				$embedded={props.embedded}
				className={props.embedded ? undefined : 'scroll-wrapper'}
			>
				{props.tags ? (
					tags.length ? (
						tags.map((tag, index) => (
							<S.Row key={`${tag.name}-${index}`}>
								<span title={tag.name}>{tag.name}</span>
								{checkValidAddress(tag.value) ? (
									<TxAddress address={tag.value} />
								) : tag.value.length ? (
									<CopyableValue
										value={tag.value}
										copiedLabel={language.copied}
										tooltipPlacement={index === 0 ? 'bottom' : 'top'}
									/>
								) : (
									<p>-</p>
								)}
							</S.Row>
						))
					) : (
						<S.Row>
							<span>{language.none}</span>
						</S.Row>
					)
				) : (
					<S.Row>
						<span>{language.processOrMessageTagsInfo}</span>
					</S.Row>
				)}
			</S.List>
		</S.Wrapper>
	);
}
