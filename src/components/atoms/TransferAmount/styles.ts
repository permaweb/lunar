import styled from 'styled-components';

export const Tooltip = styled.span`
	position: absolute;
	z-index: 2;
	display: none;
	left: 100%;
	top: 50%;
	transform: translateY(-50%);
	margin-left: 5px;
	white-space: nowrap;

	span {
		display: block;
		line-height: 1.65;
	}
`;

export const Wrapper = styled.span`
	position: relative;
	min-width: 0;
	max-width: 100%;
	display: inline-flex;
	align-items: center;
	color: ${(props) => props.theme.colors.font.primary};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.alt1};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	white-space: nowrap;

	&:hover {
		${Tooltip} {
			display: block;
		}
	}

	.info {
		padding: 0 5px 1px 5px !important;
	}
`;

export const Quantity = styled.span`
	min-width: 0;
	max-width: 60px;
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const Ticker = styled.span`
	flex: 0 0 auto;
	margin: 0 0 0 3.5px;
	text-transform: uppercase;
`;
