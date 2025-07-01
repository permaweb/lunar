import React from 'react';

import { Button } from 'components/atoms/Button';
import { IconButton } from 'components/atoms/IconButton';
import { ASSETS } from 'helpers/config';

import * as S from '../styles/index';
import { IAction, ISettings } from '../types';

import { ParameterField } from './ParameterField';

interface IPipelineViewProps {
	pipeline: IAction[];
	settings: ISettings;
	draggedIndex: number | null;
	dragOverIndex: number | null;
	expandedParams: Record<string, boolean>;
	onClearPipeline: () => void;
	onExecutePipeline: () => void;
	onRemoveFromPipeline: (uniqueId: string) => void;
	onUpdateActionParameter: (uniqueId: string, paramName: string, value: any) => void;
	onToggleParameterExpansion: (uniqueId: string) => void;
	onDragStart: (e: React.DragEvent, index: number) => void;
	onDragEnter: (e: React.DragEvent, index: number) => void;
	onContainerDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onDragEnd: () => void;
}

export const PipelineView: React.FC<IPipelineViewProps> = ({
	pipeline,
	settings,
	draggedIndex,
	dragOverIndex,
	expandedParams,
	onClearPipeline,
	onExecutePipeline,
	onRemoveFromPipeline,
	onUpdateActionParameter,
	onToggleParameterExpansion,
	onDragStart,
	onDragEnter,
	onContainerDragOver,
	onDrop,
	onDragEnd,
}) => {
	return (
		<S.Section>
			<S.Header className={'Split'}>
				Action Pipeline
				<S.PipelineActions>
					<Button type={'alt3'} iconLeftAlign icon={ASSETS.delete} label={'Clear'} handlePress={onClearPipeline} />
					<Button type={'alt3'} iconLeftAlign icon={ASSETS.send} label={'Run'} handlePress={onExecutePipeline} />
				</S.PipelineActions>
			</S.Header>
			<S.LayoutContent>
				{pipeline.length === 0 ? (
					<S.PipelinePlaceholder>Click actions from the left to add them to the pipeline</S.PipelinePlaceholder>
				) : (
					<S.PipelineContainer onDragOver={onContainerDragOver} onDrop={onDrop}>
						{pipeline.map((item, index) => {
							const isDragging = draggedIndex === index;
							const showDropLineAbove = dragOverIndex === index && draggedIndex !== null && draggedIndex !== index;

							return (
								<React.Fragment key={item.uniqueId}>
									{showDropLineAbove && <S.DropIndicator />}
									<S.PipelineItem
										draggable
										onDragStart={(e) => onDragStart(e, index)}
										onDragEnter={(e) => onDragEnter(e, index)}
										onDragEnd={onDragEnd}
										className={isDragging ? 'dragging' : ''}
									>
										<S.PipelineItemHeader
											onClick={
												item.action.params &&
												item.action.params.filter((param: any) => param.name !== 'config').length > 0
													? () => onToggleParameterExpansion(item.uniqueId)
													: undefined
											}
											className={
												item.action.params &&
												item.action.params.filter((param: any) => param.name !== 'config').length > 0
													? 'clickable'
													: ''
											}
										>
											<S.DragHandle>⋮⋮</S.DragHandle>
											<S.PipelineItemTitle>
												<span className="device">{item.deviceLabel}</span>
												<div className="action-row">
													<span className="action">{item.actionKey}</span>
													<S.ActionDescription className="inline">{item.action.description}</S.ActionDescription>
												</div>
											</S.PipelineItemTitle>
											<S.PipelineItemActions>
												{item.parameters && item.parameters.server && (
													<S.ServerBadge>{item.parameters.server}</S.ServerBadge>
												)}

												<S.MethodBadge method={item.action.method}>{item.action.method}</S.MethodBadge>
												<IconButton
													type={'primary'}
													src={ASSETS.delete}
													tooltip={'Remove'}
													tooltipPosition={'top'}
													dimensions={{
														wrapper: 26,
														icon: 14,
													}}
													handlePress={(e) => {
														e?.stopPropagation();
														onRemoveFromPipeline(item.uniqueId);
													}}
												/>
												{item.action.params &&
													item.action.params.filter((param: any) => param.name !== 'config').length > 0 && (
														<S.ExpandIcon className={expandedParams[item.uniqueId] ? 'expanded' : 'collapsed'}>
															{expandedParams[item.uniqueId] ? '▼' : '▶'}
														</S.ExpandIcon>
													)}
											</S.PipelineItemActions>
										</S.PipelineItemHeader>
										{item.action.params &&
											item.action.params.filter((param: any) => param.name !== 'config').length > 0 &&
											expandedParams[item.uniqueId] && (
												<S.ParametersContainer>
													{item.action.params
														.filter((param: any) => param.name !== 'config')
														.map((param: any) => (
															<ParameterField
																key={param.name}
																param={param}
																value={item.parameters?.[param.name]}
																onChange={(value) => onUpdateActionParameter(item.uniqueId, param.name, value)}
																servers={settings.servers}
															/>
														))}
												</S.ParametersContainer>
											)}
									</S.PipelineItem>
								</React.Fragment>
							);
						})}
						{dragOverIndex === pipeline.length && draggedIndex !== null && <S.DropIndicator />}
					</S.PipelineContainer>
				)}
			</S.LayoutContent>
		</S.Section>
	);
};
