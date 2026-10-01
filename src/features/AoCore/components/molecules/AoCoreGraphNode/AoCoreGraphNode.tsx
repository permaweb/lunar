import React from 'react';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';

import { isMessageRecord, messageJson, messageText, readCommitments } from 'api/aoCore';

import { Button } from 'components/atoms/Button';
import { CopyableValue } from 'components/atoms/CopyableValue';
import { Icon } from 'components/atoms/Icon';
import { ExplorerLink } from 'components/atoms/TxAddress';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { getFieldCoverage, getMessageFields, MESSAGE_FIELDS_PAGE_SIZE } from '../../../model/fields';
import type { GraphEntry } from '../../../model/graph';

import * as S from './styles';

export type MessageGraphNode = Node<
	{
		entry: GraphEntry;
		expandedKeys: string[];
		highlightedCommitment?: string;
		canExpand: boolean;
		onToggle: (id: string, key: string) => void;
		onRetry: (id: string) => void;
		onInspect: (id: string, key: string) => void;
	},
	'message'
>;

export default function AoCoreGraphNode(props: NodeProps<MessageGraphNode>) {
	const provider = useLanguageProvider();
	const copy = provider.object[provider.current];
	const language = copy.aoCore;
	const bodyRef = React.useRef<HTMLDivElement | null>(null);
	const [hasOverflow, setHasOverflow] = React.useState(false);
	const [page, setPage] = React.useState(0);
	const content = props.data.entry.content;
	const fields = React.useMemo(() => (content.status === 'ready' ? getMessageFields(content.value) : []), [content]);
	const message = content.status === 'ready' && isMessageRecord(content.value) ? content.value : null;
	const commitments = React.useMemo(() => (message ? readCommitments(message) : []), [message]);
	const hasDevice = message && Object.keys(message).some((key) => key.toLowerCase() === 'device');
	const device = message && (messageText(message, 'device') ?? messageText(message, 'device+link'));
	const totalPages = Math.max(1, Math.ceil(fields.length / MESSAGE_FIELDS_PAGE_SIZE));
	const activePage = Math.min(page, totalPages - 1);
	const highlighted = commitments.find((entry) => entry.id === props.data.highlightedCommitment);
	const title = props.data.entry.parent ? props.data.entry.fieldKey || '""' : language.graph.root;

	React.useEffect(() => {
		const element = bodyRef.current;
		if (!element) return;
		function updateOverflowState() {
			setHasOverflow(element.scrollHeight > element.clientHeight);
		}
		updateOverflowState();
		if (typeof ResizeObserver === 'undefined') {
			window.addEventListener('resize', updateOverflowState);
			return () => window.removeEventListener('resize', updateOverflowState);
		}
		const observer = new ResizeObserver(updateOverflowState);
		observer.observe(element);
		return () => observer.disconnect();
	}, [content, activePage, highlighted]);

	return (
		<S.Card role="group" aria-label={title}>
			<Handle type="target" position={Position.Left} isConnectable={false} />
			<Handle type="source" position={Position.Right} isConnectable={false} />
			<S.Header className="message-drag-handle">
				<S.Title title={title}>{title}</S.Title>
				{content.status === 'ready' && <S.Meta>{language.fieldCount(fields.length)}</S.Meta>}
			</S.Header>
			<S.Identity className="nodrag nopan">
				{props.data.entry.linkId && <ExplorerLink value={props.data.entry.linkId} />}
				{message && !props.data.entry.isCommitmentMetadata && (
					<S.Meta title={device || (hasDevice ? language.inlineDevice : language.defaultDevice)}>
						{language.device}:{' '}
						{device || (hasDevice ? language.inlineDevice : `message@1.0 (${language.inferredDevice})`)}
					</S.Meta>
				)}
				{content.status === 'ready' && content.provider && (
					<S.Meta title={content.provider}>
						{language.provider}: {content.provider}
					</S.Meta>
				)}
			</S.Identity>
			<S.Body ref={bodyRef} $hasOverflow={hasOverflow} className="scroll-wrapper nodrag nopan nowheel">
				{content.status === 'loading' && <S.Status role="status">{language.loadingLink}</S.Status>}
				{content.status === 'error' && (
					<S.Status role="alert">
						<p>{language.linkErrors[content.code]}</p>
						<Button type="alt3" label={language.retry} onPress={() => props.data.onRetry(props.id)} />
					</S.Status>
				)}
				{content.status === 'blocked' && (
					<S.Status role="status">{content.reason === 'cycle' ? language.cyclicLink : language.depthLimit}</S.Status>
				)}
				{highlighted && (
					<S.HighlightNote role="status">
						{language.graph.highlighted(highlighted.id)} · {language.unverified}
					</S.HighlightNote>
				)}
				{fields
					.slice(activePage * MESSAGE_FIELDS_PAGE_SIZE, (activePage + 1) * MESSAGE_FIELDS_PAGE_SIZE)
					.map((field) => {
						const expandable = !!field.linkId || field.type === 'message' || field.type === 'list';
						const isExpanded = props.data.expandedKeys.includes(field.key);
						const coverage = getFieldCoverage(field.key, commitments);
						const listed = coverage.filter((entry) => entry.status === 'listed').length;
						const unknown = coverage.filter((entry) => entry.status === 'unknown').length;
						const isCovered = highlighted?.coverage?.includes(field.key) ?? false;
						const preview =
							field.type === 'message'
								? language.fieldCount(Object.keys(field.value).length)
								: field.type === 'list'
								? language.itemCount((field.value as unknown[]).length)
								: typeof field.value === 'string'
								? field.value || '""'
								: messageJson(field.value);
						return (
							<S.Field key={field.key} $covered={isCovered} data-covered={isCovered || undefined}>
								<S.Key>
									<strong title={field.key}>{field.key || (message ? '""' : language.fieldValue)}</strong>
									<S.Meta>
										{language.fieldTypes[field.type]}
										{isCovered ? ` · ${language.coverageStates.listed}` : ''}
									</S.Meta>
								</S.Key>
								<S.Value>
									{expandable ? (
										<S.Expand
											aria-label={isExpanded ? language.collapseField(field.key) : language.expandField(field.key)}
											aria-expanded={isExpanded}
											disabled={!isExpanded && !props.data.canExpand}
											title={preview}
											onClick={() => props.data.onToggle(props.id, field.key)}
										>
											<span>{preview}</span>
											<Icon src={ASSETS.arrow} size={12} />
										</S.Expand>
									) : (
										<CopyableValue value={preview} copiedLabel={copy.copied} fullWidth />
									)}
									{commitments.length > 0 && !props.data.entry.isCommitmentMetadata && (
										<S.Coverage
											aria-label={language.expandCoverage(field.key)}
											title={language.coverageDescription}
											onClick={() => props.data.onInspect(props.id, field.key)}
										>
											{unknown && !listed
												? language.coverageStates.unknown
												: language.coverageCount(listed, commitments.length)}
											{listed > 0 && unknown > 0 ? ` · ${language.coverageUnknownCount(unknown)}` : ''}
										</S.Coverage>
									)}
								</S.Value>
							</S.Field>
						);
					})}
				{content.status === 'ready' && !fields.length && <S.Status>{language.noFields}</S.Status>}
			</S.Body>
			{totalPages > 1 && (
				<S.Pagination className="nodrag nopan">
					<Button
						type="alt3"
						label={copy.previous}
						disabled={activePage === 0}
						onPress={() => setPage(activePage - 1)}
					/>
					<S.Meta>{language.fieldsPage(activePage + 1, totalPages)}</S.Meta>
					<Button
						type="alt3"
						label={copy.next}
						disabled={activePage === totalPages - 1}
						onPress={() => setPage(activePage + 1)}
					/>
				</S.Pagination>
			)}
		</S.Card>
	);
}
