import React from 'react';

import * as S from '../styles/index';
import { IPipelineResult } from '../types';

interface IResultsDisplayProps {
	results: IPipelineResult[];
	expandedResults: Record<number, boolean>;
	onToggleResultExpansion: (index: number) => void;
}

export const ResultsDisplay: React.FC<IResultsDisplayProps> = ({
	results,
	expandedResults,
	onToggleResultExpansion,
}) => {
	return (
		<S.Section>
			<S.Header>Results</S.Header>
			<S.LayoutContent>
				<S.ResultsContainer>
					{results.length === 0 ? (
						<S.PipelinePlaceholder>No results yet. Run the pipeline to see results here.</S.PipelinePlaceholder>
					) : (
						results.map((resultItem, index) => {
							const isExpanded = expandedResults[index];
							return (
								<S.ResultItem key={index}>
									<S.ResultHeader success={resultItem.success} onClick={() => onToggleResultExpansion(index)}>
										<S.ResultInfo>
											<S.ResultTitle>
												<span>{resultItem.deviceLabel}</span>
												<span>→</span>
												<span>{resultItem.actionKey}</span>
											</S.ResultTitle>
											<S.ResultSubtitle>Server: {resultItem.serverName}</S.ResultSubtitle>
										</S.ResultInfo>
										<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
											<S.ResultStatus success={resultItem.success}>
												{resultItem.success ? 'Success' : 'Error'}
											</S.ResultStatus>
											<S.ExpandIcon className={isExpanded ? 'expanded' : 'collapsed'}>
												{isExpanded ? '▼' : '▶'}
											</S.ExpandIcon>
										</div>
									</S.ResultHeader>
									{isExpanded &&
										(resultItem.success ? (
											<S.ResultContent>
												<pre>{resultItem.result}</pre>
											</S.ResultContent>
										) : (
											<S.ErrorContent>
												<strong>Error:</strong> {resultItem.error}
											</S.ErrorContent>
										))}
								</S.ResultItem>
							);
						})
					)}
				</S.ResultsContainer>
			</S.LayoutContent>
		</S.Section>
	);
};
