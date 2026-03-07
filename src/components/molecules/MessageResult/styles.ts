import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	min-width: 0;
	display: flex;
	justify-content: space-between;
	gap: 25px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
	}
`;

export const InputWrapper = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 23.5px;
`;

export const TagsWrapper = styled.div`
	max-height: 276.5px;
	flex: 1;
	min-width: 0;
	padding: 15px;
`;

export const TagsHeader = styled.div`
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 15px 0;
	padding: 0 0 15px 0;
	border-bottom: 1px dotted ${(props) => props.theme.colors.border.primary};

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
	height: calc(100% - 55px);
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 0 12.5px 0 0;

	overflow-y: scroll;
	scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} ${(props) => props.theme.colors.scrollbar.track};

	::-webkit-scrollbar-track {
		background: ${(props) => props.theme.colors.scrollbar.track};
	}
	::-webkit-scrollbar {
		width: 15px;
		border-left: 1px solid ${(props) => props.theme.colors.border.primary};
	}
	::-webkit-scrollbar-thumb {
		background-color: ${(props) => props.theme.colors.scrollbar.thumb};
		border-radius: 36px;
		border: 3.5px solid transparent;
		background-clip: padding-box;
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		max-height: 190px;
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		gap: 20px;
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
		gap: 5px;

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
