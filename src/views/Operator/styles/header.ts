import styled from 'styled-components';

// Header and Toolbar styles
export const HeaderArea = styled.div`
	width: 100%;
	background: ${(props) => props.theme.colors.container.alt1.background};
	border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
`;

export const ToolbarWrapper = styled.div`
	width: 100%;
	position: relative;
	padding: 0px 25px;
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;
`;

export const UnifiedHeaderRow = styled.div`
	width: 100%;
	position: relative;
	padding: 0px 25px;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
`;

export const TabsSection = styled.div`
	width: 100%;
	padding: 0px 25px;
	display: flex;
	justify-content: center;
`;

export const TabsCenter = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	flex: 1;
`;

export const ToolbarLeft = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-start;
	gap: 10px;
	flex: 0 1 66px;
`;

export const ToolbarRight = styled.div`
	display: flex;
	flex-direction: row;
	justify-content: flex-end;
	flex: 0 0 196px;
	gap: 10px;
`;

export const TabsWrapper = styled.div`
	display: flex;
	position: relative;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	gap: 10px;
`;

export const Tab = styled.div<{ active: boolean }>`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-family: ${(props) => props.theme.typography.family.primary};
	color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
	cursor: pointer;
	position: relative;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 10px;
	padding: 10px 20px 10px 20px;
	margin: 0 0 -1.5px 0;
	background: ${(props) => (props.active ? props.theme.colors.view.background : 'transparent')};
	border-top: 2px solid ${(props) => (props.active ? props.theme.colors.border.alt5 : 'transparent')};
	white-space: nowrap;
	transition: all 100ms;

	.icon-wrapper {
		position: relative;
		width: 12.5px;
		height: 12.5px;
	}

	.normal-icon,
	.delete-icon {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transition: all 100ms;
	}

	.normal-icon {
		svg {
			margin: 0 0 2.5px 0;
		}
	}

	.delete-icon {
		display: none;
		margin: 1.5px 0 0 0;
	}

	&:hover .normal-icon {
		display: none;
	}

	&:hover .delete-icon {
		display: block;

		button {
			background: transparent !important;

			&:hover {
				svg {
					color: ${(props) => props.theme.colors.warning.primary} !important;
					fill: ${(props) => props.theme.colors.warning.primary} !important;
				}
			}
		}
	}

	svg {
		height: 12.5px;
		width: 12.5px;
		color: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
		fill: ${(props) => (props.active ? props.theme.colors.font.primary : props.theme.colors.font.alt3)};
	}

	&:hover {
		color: ${(props) => props.theme.colors.font.primary};

		svg {
			color: ${(props) => props.theme.colors.font.primary};
			fill: ${(props) => props.theme.colors.font.primary};
		}
	}

	&:before {
		display: block;
		content: '';
		position: absolute;
		z-index: 1;
		left: 0;
		transform: translate(-50%, 0);
		top: 0;
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		height: 100%;
		width: 1px;
		pointer-events: none;
	}

	&:after {
		display: block;
		content: '';
		position: absolute;
		z-index: 1;
		right: -1px;
		transform: translate(-50%, 0);
		top: 0;
		background: ${(props) => (props.active ? props.theme.colors.border.primary : 'transparent')};
		height: 100%;
		width: 1px;
		pointer-events: none;
	}
`;
