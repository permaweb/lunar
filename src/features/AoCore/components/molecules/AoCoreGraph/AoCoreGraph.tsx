import React from 'react';
import {
	applyNodeChanges,
	Background,
	type Edge,
	MarkerType,
	ReactFlow,
	ReactFlowProvider,
	useNodesInitialized,
	useReactFlow,
} from '@xyflow/react';

import { isMessageRecord, type MessageValue, readCommitments } from 'api/aoCore';

import { Button } from 'components/atoms/Button';
import { useLanguageProvider } from 'providers/LanguageProvider';

import '@xyflow/react/dist/style.css';

import { useAoCoreGraph } from '../../../hooks/useAoCoreGraph';
import { arrangeGraph, MAX_GRAPH_NODES } from '../../../model/graph';
import { AoCoreCoverage } from '../AoCoreCoverage';
import { AoCoreGraphEdge } from '../AoCoreGraphEdge';
import { AoCoreGraphNode, type MessageGraphNode } from '../AoCoreGraphNode';
import { NODE_HEIGHT, NODE_WIDTH } from '../AoCoreGraphNode/styles';

import * as S from './styles';

const NODE_TYPES = { message: AoCoreGraphNode };
const EDGE_TYPES = { message: AoCoreGraphEdge };
const FIT_OPTIONS = { padding: 0.15, maxZoom: 1, duration: 0 };

function GraphCanvas(props: { value: MessageValue; rootId: string }) {
	const provider = useLanguageProvider();
	const copy = provider.object[provider.current];
	const language = copy.aoCore;
	const graph = useAoCoreGraph(props.value, props.rootId);
	const flow = useReactFlow<MessageGraphNode>();
	const initialized = useNodesInitialized();
	const positionsScope = React.useRef(graph.scope);
	const [nodes, setNodes] = React.useState<MessageGraphNode[]>([]);
	const [layoutRevision, setLayoutRevision] = React.useState(0);
	const [inspection, setInspection] = React.useState<{ id: string; key: string; commitment?: string } | null>(null);
	const inspectedEntry = graph.entries.find((entry) => entry.id === inspection?.id);
	const inspectedMessage =
		inspectedEntry?.content.status === 'ready' && isMessageRecord(inspectedEntry.content.value)
			? inspectedEntry.content.value
			: null;
	const edges = React.useMemo<Edge[]>(
		() =>
			graph.entries
				.filter((entry) => entry.parent)
				.map((entry) => ({
					id: entry.id,
					source: entry.parent,
					target: entry.id,
					type: 'message',
					label: entry.fieldKey || '""',
					ariaLabel: language.graph.connection(entry.fieldKey || '""', !!entry.linkId),
					markerEnd: { type: MarkerType.ArrowClosed },
					className: entry.linkId ? 'message-link' : 'message-inline',
				})),
		[graph.entries, language.graph]
	);
	const handleInspect = React.useCallback((id: string, key: string) => setInspection({ id, key }), []);

	React.useEffect(() => {
		setInspection(null);
	}, [graph.scope]);

	React.useEffect(() => {
		const sameScope = positionsScope.current === graph.scope;
		positionsScope.current = graph.scope;
		setNodes((previous) => {
			const placed: MessageGraphNode[] = [];
			for (const entry of graph.entries) {
				const existing = sameScope ? previous.find((node) => node.id === entry.id) : undefined;
				const parent = placed.find((node) => node.id === entry.parent);
				const x = parent ? parent.position.x + NODE_WIDTH + 150 : 0;
				const neighbors = placed.filter((node) => Math.abs(node.position.x - x) < NODE_WIDTH);
				const y = neighbors.length
					? Math.max(...neighbors.map((node) => node.position.y)) + NODE_HEIGHT + 60
					: parent?.position.y ?? 0;
				placed.push({
					...existing,
					id: entry.id,
					type: 'message',
					position: existing?.position ?? { x, y },
					dragHandle: '.message-drag-handle',
					ariaLabel: entry.fieldKey || language.graph.root,
					data: {
						entry,
						expandedKeys: graph.entries.filter((child) => child.parent === entry.id).map((child) => child.fieldKey),
						highlightedCommitment: inspection?.id === entry.id ? inspection.commitment : undefined,
						canExpand: graph.entries.length < MAX_GRAPH_NODES,
						onToggle: graph.onToggle,
						onRetry: graph.onRetry,
						onInspect: handleInspect,
					},
				});
			}
			return placed;
		});
	}, [graph.entries, graph.scope, graph.onToggle, graph.onRetry, inspection, handleInspect, language.graph.root]);

	React.useEffect(() => {
		if (initialized) void flow.fitView(FIT_OPTIONS);
	}, [initialized, graph.entries.length, layoutRevision, flow.fitView]);

	function handleArrange() {
		const positions = arrangeGraph(graph.entries, NODE_WIDTH, NODE_HEIGHT);
		setNodes((previous) => previous.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })));
		setLayoutRevision((previous) => previous + 1);
	}

	return (
		<S.Wrapper>
			<S.Toolbar>
				<p>{language.graph.description}</p>
				<S.Actions>
					<Button type="alt3" label={language.graph.zoomOut} onPress={() => void flow.zoomOut({ duration: 0 })} />
					<Button type="alt3" label={language.graph.zoomIn} onPress={() => void flow.zoomIn({ duration: 0 })} />
					<Button type="alt3" label={language.graph.fit} onPress={() => void flow.fitView(FIT_OPTIONS)} />
					<Button type="alt3" label={language.graph.arrange} onPress={handleArrange} />
				</S.Actions>
			</S.Toolbar>
			{graph.entries.length >= MAX_GRAPH_NODES && (
				<S.Notice role="status">{language.graph.limit(MAX_GRAPH_NODES)}</S.Notice>
			)}
			<S.Canvas role="region" aria-label={language.graph.view}>
				<ReactFlow<MessageGraphNode>
					proOptions={{ hideAttribution: true }}
					nodes={nodes}
					edges={edges}
					nodeTypes={NODE_TYPES}
					edgeTypes={EDGE_TYPES}
					onNodesChange={(changes) => setNodes((previous) => applyNodeChanges(changes, previous))}
					nodesConnectable={false}
					edgesReconnectable={false}
					deleteKeyCode={null}
					minZoom={0.15}
					maxZoom={1.5}
					fitView
					fitViewOptions={FIT_OPTIONS}
				>
					<Background />
				</ReactFlow>
			</S.Canvas>
			<S.Legend>
				{language.graph.legend} · {language.unverified}
			</S.Legend>
			{inspectedMessage && inspection && (
				<S.Evidence>
					<S.Toolbar>
						<p>{language.graph.selectCommitment}</p>
						<Button type="alt3" label={copy.close} onPress={() => setInspection(null)} />
					</S.Toolbar>
					<AoCoreCoverage
						fieldKey={inspection.key}
						commitments={readCommitments(inspectedMessage)}
						selectedCommitment={inspection.commitment}
						onSelectCommitment={(id) =>
							setInspection((previous) =>
								previous ? { ...previous, commitment: previous.commitment === id ? undefined : id } : null
							)
						}
					/>
				</S.Evidence>
			)}
		</S.Wrapper>
	);
}

export default function AoCoreGraph(props: { value: MessageValue; rootId: string }) {
	return (
		<ReactFlowProvider>
			<GraphCanvas value={props.value} rootId={props.rootId} />
		</ReactFlowProvider>
	);
}
