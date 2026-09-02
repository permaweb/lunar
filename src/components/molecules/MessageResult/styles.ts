import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	width: 100%;
	min-width: 0;
	display: flex;
	justify-content: space-between;
	gap: ${CSS_DIMENSIONS.px25};

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
	}
`;

export const InputWrapper = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px23_5};
`;

export const TagsWrapper = styled.div`
	max-height: ${CSS_DIMENSIONS.px276_5};
	flex: 1;
	min-width: 0;
	padding: ${CSS_DIMENSIONS.px15};
`;

export const TagsHeader = styled.div`
	height: ${CSS_DIMENSIONS.px40};
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 ${CSS_DIMENSIONS.px15} 0;
	padding: 0 0 ${CSS_DIMENSIONS.px15} 0;
	border-bottom: ${CSS_DIMENSIONS.px1} dotted ${(props) => props.theme.colors.border.primary};

	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const TagsBody = styled.div`
	height: calc(100% - ${CSS_DIMENSIONS.px55});
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px10};
	padding: 0 ${CSS_DIMENSIONS.px12_5} 0 0;

	overflow-y: scroll;
	scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} ${(props) => props.theme.colors.scrollbar.track};

	::-webkit-scrollbar-track {
		background: ${(props) => props.theme.colors.scrollbar.track};
	}
	::-webkit-scrollbar {
		width: ${CSS_DIMENSIONS.px15};
		border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}
	::-webkit-scrollbar-thumb {
		background-color: ${(props) => props.theme.colors.scrollbar.thumb};
		border-radius: ${CSS_DIMENSIONS.px36};
		border: ${CSS_DIMENSIONS.px3_5} solid transparent;
		background-clip: padding-box;
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		max-height: ${CSS_DIMENSIONS.px190};
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		gap: ${CSS_DIMENSIONS.px20};
	}
`;

export const TagLine = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		white-space: nowrap;
	}

	p {
		color: ${(props) => props.theme.colors.font.primary};
		text-align: right;
		text-align: right;
		max-width: 45%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		max-width: 45%;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: ${CSS_DIMENSIONS.px5};

		p {
			text-align: left;
		}
	}
`;

export const DataWrapper = styled.div`
	flex: 1;
	min-width: 0;
`;

export const ResultWrapper = styled.div`
	flex: 1;
	min-width: 0;
`;

export const Editor = styled.div`
	width: 100%;
	min-width: 0;
`;
