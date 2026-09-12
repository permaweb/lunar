import styled, { DefaultTheme } from 'styled-components';

import { STYLING } from 'helpers/config';

function getDesktopLastRowBorderStyles(props: {
	$columns?: 2 | 3;
	$desktopItemCount?: number;
	$hideDesktopLastRowBorder?: boolean;
	theme: DefaultTheme;
}) {
	const columns = props.$columns ?? 3;
	if (props.$desktopItemCount) {
		const lastRowStart = props.$desktopItemCount - ((props.$desktopItemCount - 1) % columns);
		const alignIncompleteLastItem =
			props.$desktopItemCount % columns !== 0
				? `
					> *:last-child {
						justify-content: flex-start;
						text-align: left;
					}
				`
				: '';

		return `
			> * {
				border-bottom: 1px solid ${props.theme.colors.border.primary};
			}

			> *:nth-child(n + ${lastRowStart}) {
				border-bottom: none;
			}

			${alignIncompleteLastItem}
		`;
	}

	if (!props.$hideDesktopLastRowBorder) return '';

	return `
		> *:nth-last-child(-n + ${columns}) {
			border-bottom: none;
		}
	`;
}

export const MessageInfo = styled.div`
	width: 100%;
`;

export const MessageInfoHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	padding: 12.5px 15px;

	p {
		display: flex;
		align-items: center;
		gap: 7.5px;

		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};

		span {
			font-size: ${(props) => props.theme.typography.size.xxSmall};
			font-family: ${(props) => props.theme.typography.family.primary};
			font-weight: ${(props) => props.theme.typography.weight.bold};
			color: ${(props) => props.theme.colors.font.alt1};
		}
	}

	> div {
		padding: 0 !important;
		border-right: none !important;
	}
`;

export const MessageInfoBody = styled.div<{
	$desktopItemCount?: number;
	$hideDesktopLastRowBorder?: boolean;
	$columns?: 2 | 3;
}>`
	display: grid;
	grid-template-columns: repeat(${(props) => props.$columns ?? 3}, 1fr);

	> *:last-child,
	> *:nth-child(${(props) => props.$columns ?? 3}n) {
		justify-content: flex-end;
		text-align: right;
		border-right: none;
	}

	> *:first-child,
	> *:nth-child(2),
	> *:nth-child(3),
	> *:nth-child(4),
	> *:nth-child(5),
	> *:nth-child(6) {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}

	> *:nth-child(${(props) => props.$columns ?? 3}n + 2) {
		padding: 10px 15px;
	}

	@media (min-width: ${STYLING.cutoffs.desktop}) {
		${getDesktopLastRowBorderStyles}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		grid-template-columns: repeat(1, 1fr);

		> * {
			justify-content: flex-start;
			text-align: left;
			border-right: none;
			border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
		}

		> *:last-child {
			border-bottom: none;
		}
	}
`;

export const TxOverviewValue = styled.div`
	display: flex;
	align-items: center;
	gap: 7.5px;

	p {
		line-height: 1.35;
	}

	small {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		line-height: 1.35;
	}
`;

export const MessageInfoLine = styled.div`
	min-height: 47.5px;
	display: flex;
	align-items: center;
	gap: 7.5px;
	padding: 10px 15px;
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
		align-items: flex-start;
		border-right: none;
		padding: 15px;
	}
`;
