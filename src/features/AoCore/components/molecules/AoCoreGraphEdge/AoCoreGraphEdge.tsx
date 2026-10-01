import React from 'react';
import { BaseEdge, type EdgeProps, getSmoothStepPath } from '@xyflow/react';

import * as S from './styles';

export default function AoCoreGraphEdge(props: EdgeProps): React.ReactElement {
	const [path, labelX, labelY] = getSmoothStepPath({
		sourceX: props.sourceX,
		sourceY: props.sourceY,
		sourcePosition: props.sourcePosition,
		targetX: props.targetX,
		targetY: props.targetY,
		targetPosition: props.targetPosition,
	});
	const width = Math.max(
		0,
		Math.min(S.LABEL_MAX_WIDTH, Math.abs(props.targetX - props.sourceX) - S.LABEL_SIDE_GAP * 2)
	);

	return (
		<>
			<BaseEdge id={props.id} path={path} markerStart={props.markerStart} markerEnd={props.markerEnd} />
			{width > 0 && props.label && (
				<foreignObject x={labelX - width / 2} y={labelY - S.LABEL_OFFSET} width={width} height={S.LABEL_HEIGHT}>
					<S.Label title={typeof props.label === 'string' ? props.label : undefined}>{props.label}</S.Label>
				</foreignObject>
			)}
		</>
	);
}
