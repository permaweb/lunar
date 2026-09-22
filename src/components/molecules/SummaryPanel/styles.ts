import styled from 'styled-components';

import { OverviewStyles } from 'components/molecules/Overview';
import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 15px;
	padding: 12.5px 15px 17.5px 15px;
`;

export const Header = styled(OverviewStyles.MessageInfoHeader)`
	padding: 0 0 12.5px 0;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;

	> * {
		&:not(:last-child) {
			border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
			padding: 0 0 15px 0;
		}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		gap: 0;

		> * {
			&:not(:last-child) {
				border-bottom: none;
				padding: 0;
			}
		}
	}
`;

export const Line = styled(OverviewStyles.MessageInfoLine)`
	min-height: 22.5px;
	max-height: 45px;
	padding: 0;
	border-right: none;
	gap: 15px;

	> * {
		&:not(:last-child) {
			border-right: 1px solid ${(props) => props.theme.colors.border.primary};
			padding: 0 15px 0 0;
		}
	}

	> *:last-child {
		justify-content: flex-end;
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		width: 100%;
		max-height: none;
		align-items: stretch;
		gap: 0;

		> * {
			width: 100%;
			min-height: 47.5px;
			flex: none;
			justify-content: center;
			border-right: none;
			border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
			padding: 15px 0;
		}

		> *:not(:last-child) {
			border-right: none;
			padding: 15px 0;
		}

		> *:last-child {
			justify-content: center;
		}

		&:last-child > *:last-child {
			border-bottom: none;
		}
	}
`;

export const LineElement = styled.div<{ $hasDivider: boolean }>`
	display: flex;
	flex: 1;
	align-items: center;
	gap: 7.5px;
	${(props) => (props.$hasDivider ? '' : 'border-right: none !important;')}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
		align-items: flex-start;
	}
`;
