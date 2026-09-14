import React from 'react';

import type { NodeForkHistory } from 'api/arweaveNode';

import { ExplorerLink } from 'components/atoms/TxAddress';
import { formatBlockId } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

const ROW = 152;
const LANE = 220;
const LEFT = 90;
export default function ForkHistoryGraph(props: { history: NodeForkHistory }) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	const scrollRef = React.useRef<HTMLDivElement>(null);
	const [scrollTop, setScrollTop] = React.useState(0);
	const [viewportHeight, setViewportHeight] = React.useState(0);
	React.useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;
		const measure = () => setViewportHeight(element.clientHeight);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const graph = props.history.graph;
	const top = Math.max(0, Math.floor(scrollTop / ROW) - 1);
	const bottom = top + Math.ceil(viewportHeight / ROW) + 2;
	const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
	const blocks = new Map(props.history.blocks.map((block) => [block.hash, block]));
	const width = Math.max(340, LEFT + graph.lanes * LANE);
	const height = graph.heights.length * ROW + 20;
	return (
		<S.Scroll
			ref={scrollRef}
			tabIndex={0}
			role={'region'}
			aria-label={language.nodeForkHistory}
			onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
		>
			<S.Canvas $width={width} $height={height}>
				<S.Edges width={width} height={height} aria-hidden={'true'}>
					{graph.edges.map((edge) => {
						const parent = nodes.get(edge.parent)!;
						const child = nodes.get(edge.child)!;
						if (parent.row < top || child.row > bottom) return null;
						const x1 = LEFT + parent.lane * LANE + 100;
						const y1 = parent.row * ROW + 10;
						const x2 = LEFT + child.lane * LANE + 100;
						const y2 = child.row * ROW + 136;
						return (
							<path
								key={edge.child}
								d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
							/>
						);
					})}
				</S.Edges>
				{graph.heights.slice(top, bottom + 1).map((height, i) => (
					<S.Height key={height} $top={(top + i) * ROW + 50}>
						{height.toLocaleString()}
					</S.Height>
				))}
				{graph.nodes
					.filter((node) => node.row >= top && node.row <= bottom)
					.map((node) => {
						const timestamp = blocks.get(node.hash)?.timestamp;
						return (
							<S.Card key={node.id} $state={node.state} $left={LEFT + node.lane * LANE} $top={node.row * ROW + 10}>
								<S.Title>{node.height.toLocaleString()}</S.Title>
								{node.hash ? (
									<ExplorerLink type={'block'} value={node.hash} label={formatBlockId(node.hash, false)} />
								) : (
									<span>—</span>
								)}
								<S.Label $orphan={node.state === 'orphan'}>{language.nodeForkStates[node.state]}</S.Label>
								{timestamp && <S.Time>{new Date(timestamp * 1000).toLocaleString()}</S.Time>}
							</S.Card>
						);
					})}
			</S.Canvas>
		</S.Scroll>
	);
}
