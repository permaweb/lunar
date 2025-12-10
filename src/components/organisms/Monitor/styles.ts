import styled, { css, DefaultTheme } from 'styled-components';

import { STYLING } from 'helpers/config';

export const MonitorTableWrapper = styled.div`
	height: fit-content !important;
	max-height: 100%;
	width: 100%;
`;

export const Header = styled.div`
	padding: 15px;
	margin: 0;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.primary.background};
`;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 25px;

	.update-wrapper {
		padding: 2.5px 25px;
	}

	.loader {
		> div {
			height: fit-content;
			width: fit-content;
		}
	}
`;

export const HeaderLabel = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;

	p {
		font-size: ${(props) => props.theme.typography.size.base};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12.5px;
`;

export const BodyWrapper = styled.div`
	width: 100%;
`;

export const SubheaderWrapper = styled.div`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	background: ${(props) => props.theme.colors.container.alt1.background};

	div,
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	> {
		&:last-child {
			display: flex;
			justify-content: flex-end;
			text-align: right;
		}
	}
`;

export const ElementItem = styled.div`
	display: flex;
`;

export const ID = styled(ElementItem)`
	min-width: 185px;
	width: 185px;
	display: flex;
	align-items: center;
	gap: 12.5px;
`;

export const Current = styled(ElementItem)`
	min-width: 90px;
	width: 90px;
	display: flex;
	align-items: center;
	gap: 12.5px;
`;

export const Target = styled(ElementItem)`
	min-width: 90px;
	width: 90px;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 12.5px;
	p {
		text-align: right;
	}
`;

export const Status = styled(ElementItem)`
	min-width: 90px;
	width: 90px;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 12.5px;
	p {
		text-align: right;
	}
`;

function getStatusBackground(percentage: string | number | null, theme: DefaultTheme) {
	if (!percentage) return theme.colors.container.alt8.background;
	if (percentage === 'Error') return theme.colors.warning.primary;
	if ((percentage as any) < 100) return theme.colors.indicator.neutral;
	else return theme.colors.indicator.active;
}

export const StatusIndicator = styled(Status)<{ percentage: string | number | null }>`
	p {
		padding: 0 5.5px;
		background: ${(props) => getStatusBackground(props.percentage, props.theme)} !important;
		color: ${(props) => props.theme.colors.font.light1} !important;
		font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
		border-radius: ${STYLING.dimensions.radius.alt2};
	}
`;

export const Actions = styled(ElementItem)`
	min-width: 90px;
	width: 90px;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 12.5px;
	p {
		text-align: right;
	}
`;

export const ElementsWrapper = styled.div`
	width: 100%;

	> * {
		&:not(:last-child) {
			border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
		}
		&:last-child {
		}
	}
`;

export const ElementWrapper = styled.div<{ open: boolean; lastChild?: boolean }>`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
	transition: all 100ms;
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
	}

	${(props) =>
		props.open &&
		css`
			border-left: 1px solid ${props.theme.colors.border.alt4} !important;
			border-right: 1px solid ${props.theme.colors.border.alt4} !important;
			border-bottom: 1px solid ${props.theme.colors.border.alt4} !important;

			background: ${props.theme.colors.container.primary.active};

			&::after {
				content: '';
				position: absolute;
				height: 1px;
				width: calc(100% + 2px);
				top: -1px;
				left: -1px;
				right: 0;
				bottom: 0;
				border-top: 1px solid ${props.theme.colors.border.alt4};
				transition: all 100ms;
			}
		`}
`;

export const WrapperEmpty = styled.div`
	padding: 15px;

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: uppercase;
	}
`;
