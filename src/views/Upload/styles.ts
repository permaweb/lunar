import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { getTranslucentColor } from 'helpers/utils';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
`;

export const Subheader = styled.div`
	width: fit-content;
	padding: 4.5px 15px;
	display: flex;
	align-items: center;
	justify-content: center;
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
`;

export const BodyWrapper = styled.div`
	width: 100%;
	display: flex;
	gap: 40px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
	}
`;

export const MainWrapper = styled.div`
	width: calc(100% - 380px);
	display: flex;
	flex-direction: column;
	gap: 15px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		width: 100%;
	}
`;

export const SideWrapper = styled.div`
	width: 380px;
	display: flex;
	flex-direction: column;
	gap: 25px;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		width: 100%;
	}
`;

export const Panel = styled.div<{ $noWrapper?: boolean }>`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: ${(props) => (props.$noWrapper ? '0' : '15px')};
	position: relative;
`;

export const UploadMain = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 15px;
	position: relative;
`;

export const ActivityMain = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 15px;
	position: relative;
`;

export const PanelHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		white-space: nowrap;
	}
`;

export const PanelActions = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

export const DropZone = styled.label<{ active: boolean; disabled: boolean }>`
	min-height: 240px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12.5px;
	border: 1px dotted ${(props) => (props.active ? props.theme.colors.border.alt1 : props.theme.colors.border.primary)};
	border-radius: ${STYLING.dimensions.radius.primary};
	background: ${(props) =>
		props.active ? props.theme.colors.container.alt2.background : props.theme.colors.container.alt1.background};
	cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
	transition: all 100ms;

	&:hover {
		background: ${(props) =>
			props.active ? props.theme.colors.container.alt2.background : props.theme.colors.container.alt2.background};
		border-color: ${(props) => (props.disabled ? props.theme.colors.border.alt1 : props.theme.colors.border.alt1)};
	}

	input {
		display: none;
	}

	svg {
		height: 25px;
		width: 25px;
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		text-align: center;
	}
`;

export const SummaryWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
	justify-content: space-between;
	padding: 20px 0;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const SummarySection = styled.div`
	min-width: 0;
	display: flex;
	gap: 5.35px;

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		white-space: nowrap;
	}

	.metric-value {
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
		white-space: normal;
	}
`;

export const UploadActionWrapper = styled.div`
	display: flex;
	justify-content: flex-end;
`;

export const ListWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;

	> * {
		&:first-child {
			padding: 0 0 12.5px 0;
		}

		&:not(:first-child) {
			padding: 12.5px 0;
		}
	}
`;

export const ListRow = styled.div`
	min-height: 50px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const ListRowSection = styled.div`
	display: flex;
	gap: 12.5px;
`;

export const ListRowRemove = styled.div`
	svg {
		margin: 0 0 0.5px 0;
	}
`;

export const Thumb = styled.div`
	height: 42.5px;
	width: 42.5px;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.colors.container.alt2.background};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt2};
	overflow: hidden;

	img {
		height: 100%;
		width: 100%;
		object-fit: cover;
	}

	div {
		height: 18.5px;
		width: 18.5px;
	}

	svg {
		height: 18.5px;
		width: 18.5px;
		color: ${(props) => props.theme.colors.font.alt1};
		fill: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const ListRowInfo = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 3.5px;

	> p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
	}

	> span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		overflow-wrap: anywhere;
	}

	.row-error {
		color: ${(props) => props.theme.colors.warning.primary};
	}
`;

export const ListRowError = styled.div`
	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const RowLinks = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 2.5px 15px;
	margin: 2.5px 0 0 0;

	a {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.link.color};
		white-space: nowrap;

		&:hover {
			color: ${(props) => props.theme.colors.link.active};
		}
	}
`;

export const ListRowValue = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 3.5px;

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		white-space: nowrap;
	}
`;

export const EmptyRow = styled.div`
	min-height: 50px;
	display: flex;
	align-items: center;
	justify-content: center;

	padding: 15px !important;

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

function statusColor(props: any, status: string) {
	switch (status) {
		case 'uploading':
			return props.theme.colors.warning.caution;
		case 'complete':
			return props.theme.colors.indicator.active;
		case 'error':
			return props.theme.colors.warning.primary;
		default:
			return props.theme.colors.container.alt8.background;
	}
}

export const StatusPill = styled.div<{ status: string }>`
	min-width: 77.5px;
	padding: 3.5px 12.5px 2.5px 12.5px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => getTranslucentColor(statusColor(props, props.status), 1)};
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt1};

	span {
		font-size: ${(props) => props.theme.typography.size.xxxxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-transform: uppercase;
		white-space: nowrap;
	}
`;

export const CostBadge = styled.div<{ paid: boolean }>`
	min-width: 77.5px;
	padding: 3.5px 12.5px 2.5px 12.5px;
	display: flex;
	align-items: center;
	background: ${(props) =>
		getTranslucentColor(props.paid ? props.theme.colors.warning.caution : props.theme.colors.indicator.active, 1)};
	border-radius: ${STYLING.dimensions.radius.alt1};

	span {
		font-size: ${(props) => props.theme.typography.size.xxxxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.light1};
		text-transform: uppercase;
	}
`;

export const UnitLines = styled.div`
	display: grid;
	grid-template-columns: repeat(40, minmax(2px, 1fr));
	align-items: end;
	gap: 3.5px;
`;

export const UnitLine = styled.div<{ tone: 'healthy' | 'warning' | 'critical' | 'empty' }>`
	height: 47.5px;
	border-radius: ${STYLING.dimensions.radius.alt1};
	background: ${(props) => {
		switch (props.tone) {
			case 'healthy':
				return props.theme.colors.indicator.active;
			case 'warning':
				return props.theme.colors.warning.caution;
			case 'critical':
				return props.theme.colors.warning.primary;
			default:
				return props.theme.colors.container.alt3.background;
		}
	}};
	transition: background 200ms;
`;

export const BalanceMetric = styled.div`
	display: flex;
	flex-direction: column;
	align-items: baseline;
	gap: 7.5px;
	min-width: 0;

	> span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		white-space: nowrap;
	}
`;

/* The number sits in its own span (.balance-live-value) so the frame-rate
   animation can rewrite it without touching the helper label before it; being
   at the end of its line, its changing width doesn't push anything around. */
export const BalanceValue = styled.div`
	position: relative;
	min-width: 0;

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		white-space: nowrap;

		span {
			color: ${(props) => props.theme.colors.font.alt1};
			font-family: ${(props) => props.theme.typography.family.alt1};
			font-size: ${(props) => props.theme.typography.size.xxSmall};
			font-weight: ${(props) => props.theme.typography.weight.medium};
			white-space: nowrap;
		}

		.balance-live-value {
			color: ${(props) => props.theme.colors.font.primary};
			font-weight: ${(props) => props.theme.typography.weight.bold};
		}
	}
`;

export const MetricGrid = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px 15px;
`;

export const MetricSection = styled.div`
	width: 100%;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 5.35px;

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		white-space: nowrap;
	}

	.metric-value {
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
		white-space: normal;
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}
`;

export const ConnectWrapper = styled.div`
	min-height: 180px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 15px;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		text-align: center;
	}
`;

export const MWrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 0 20px 20px 20px !important;

	> p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
		line-height: 1.5;
		overflow-wrap: anywhere;
	}
`;

export const MCostWrapper = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 15px;
	padding: 12.5px 15px;
	background: ${(props) => props.theme.colors.container.alt2.background};
	border-radius: ${STYLING.dimensions.radius.primary};

	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const MActionsWrapper = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: 10px;
`;

/* Activity table — mirrors the TransactionList / BlockList table styling exactly
   (40px bordered rows, fit-content width inside a horizontally scrollable
   wrapper, fixed-width cells, hover highlight). */
export const TableWrapper = styled.div`
	width: 100%;
	overflow: auto;
	background: ${(props) => props.theme.colors.container.primary.background};
	border-radius: ${STYLING.dimensions.radius.alt1};
`;

export const TableHeader = styled.div`
	height: 42px;
	min-width: 100%;
	width: fit-content;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-top-left-radius: ${STYLING.dimensions.radius.alt1};
	border-top-right-radius: ${STYLING.dimensions.radius.alt1};
	background: ${(props) => props.theme.colors.container.alt1.background};

	div,
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const TableBody = styled.div`
	width: 100%;

	> *:last-child {
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary} !important;
		border-bottom-left-radius: ${STYLING.dimensions.radius.alt1};
		border-bottom-right-radius: ${STYLING.dimensions.radius.alt1};
	}

	.activity-list-element {
		border-left: 1px solid ${(props) => props.theme.colors.border.primary};
		border-right: 1px solid ${(props) => props.theme.colors.border.primary};
		border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
	}
`;

export const TableRow = styled.div`
	height: 40px;
	min-width: 100%;
	width: fit-content;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 15px;
	padding: 0 15px;
	cursor: pointer;
	transition: all 75ms;
	background: ${(props) => props.theme.colors.container.primary.background};

	p {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&:hover {
		background: ${(props) => props.theme.colors.container.primary.active};
		border-left: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-right: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
		border-bottom: 1px solid ${(props) => props.theme.colors.border.alt4} !important;
	}

	&:hover::after {
		content: '';
		position: absolute;
		height: 1px;
		width: calc(100% + 2px);
		top: -1px;
		left: -1px;
		right: 0;
		bottom: 0;
		border-top: 1px solid ${(props) => props.theme.colors.border.alt4};
		transition: all 100ms;
	}
`;

export const TableItem = styled.div`
	display: flex;
	align-items: center;
`;

export const TableName = styled(TableItem)`
	min-width: 260px;
	width: 260px;
	justify-content: flex-start;

	p {
		text-align: left;
	}
`;

export const TableStatus = styled(TableItem)`
	min-width: 165px;
	width: 165px;
	justify-content: flex-start;
`;

export const TableStatusValue = styled(TableStatus)<{ background?: string }>`
	position: relative;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	gap: 7.5px;

	.type-indicator {
		height: 8px;
		width: 8px;
		border-radius: 50%;
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		background: ${(props) => (props.background ? props.background : props.theme.colors.container.alt8.background)};
	}

	p {
		min-width: 0;
		flex: 0 1 auto;
		max-width: 100%;
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.medium} !important;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`;

export const TableID = styled(TableItem)`
	min-width: 170px;
	width: 170px;
`;

export const TableSize = styled(TableItem)`
	min-width: 115px;
	width: 115px;
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const TableTime = styled(TableItem)`
	min-width: 185px;
	width: 185px;
	justify-content: flex-end;

	p {
		text-align: right;
	}
`;

export const LinkLabel = styled.div`
	max-width: 100%;

	a,
	button {
		max-width: 100%;
		display: block;
	}

	p {
		color: ${(props) => props.theme.colors.link.color};
	}

	a:hover p,
	button:hover p {
		color: ${(props) => props.theme.colors.link.active};
		text-decoration: underline;
		text-decoration-thickness: 1.25px;
	}

	button {
		text-align: left;
	}
`;
