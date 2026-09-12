import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';

export { Actions, ButtonGroup, Divider, Error, Note, PageCount, PanelContent, Section } from '../ArweaveNode/styles';

export const BlockCount = styled(PrimitiveButton)`
	display: inline-flex;
	align-items: center;
	gap: 7.5px;
	padding: 0;
	border: 0;
	background: transparent;
	color: ${(props) => props.theme.colors.link.color};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	svg {
		transition: transform 150ms ease-in-out;
	}
	&[aria-expanded='true'] svg {
		transform: rotate(180deg);
	}
	@media (prefers-reduced-motion: reduce) {
		svg {
			transition: none;
		}
	}
	&:hover {
		text-decoration: underline;
	}
	&:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 3px;
	}
`;

export const MinerBlocks = styled.div`
	min-width: 0;
	border: 1px solid ${(props) => props.theme.colors.border.alt1};
`;
