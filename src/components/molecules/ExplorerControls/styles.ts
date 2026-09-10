import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div<{ isFullscreen?: boolean }>`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: 25px;
	position: relative;

	&:fullscreen {
		background: ${(props) => props.theme.colors.container.primary.background};
		padding: 25px;
		overflow: auto;
	}
`;

export const HeaderWrapper = styled.form`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 20px;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

export const HeaderActionsWrapper = styled.div`
	display: flex;
	align-items: flex-start;
	flex-wrap: wrap;
	gap: 20px;
`;

export const BodyWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 25px;
`;

export const SearchWrapper = styled.div`
	height: 38.5px;
	max-width: 100%;
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 15px;
	position: relative;
	padding: 0 0 0 0.5px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		height: auto;
	}
`;

export const SearchInputWrapper = styled.div`
	width: 510px;
	max-width: 100%;
	position: relative;

	input {
		max-width: 100%;
		padding: 10px 10px 10px 42.5px !important;
	}

	svg {
		height: 15px;
		width: 15px;
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
		position: absolute;
		z-index: 1;
		top: 11.5px;
		left: 14.5px;
	}
`;

export const TxInfoWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: 15px;
	flex-wrap: wrap;
`;

export const UpdateWrapper = styled.div`
	min-height: 30px;
	width: fit-content;
	padding: 5.5px 15px 4.5px 15px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6.5px;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: 1px solid ${(props) => props.theme.colors.container.alt8.background};
	border-radius: ${STYLING.dimensions.radius.alt2};

	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xxxxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-align: center;
	}
`;

export const UpdateWrapperType = styled(UpdateWrapper)`
	padding: 5.5px 15px 4.5px 13.5px;
	gap: 9.5px;

	div {
		height: 12px;
		width: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	svg {
		height: 12px;
		width: 12px;
		color: ${(props) => props.theme.colors.font.light2};
		fill: ${(props) => props.theme.colors.font.light2};
	}
`;
