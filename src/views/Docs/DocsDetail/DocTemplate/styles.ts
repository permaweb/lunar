import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div`
	width: 100%;
	display: flex;
	gap: 40px;
	position: relative;
`;

export const TableOfContents = styled.aside`
	height: fit-content;
	width: 240px;
	position: sticky;
	top: 100px;
	align-self: flex-start;
	max-height: calc(100vh - 120px);
	overflow-y: auto;
	order: 2;
	padding: 0 0 0 15px;
	border-left: 1px solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const TOCTitle = styled.h4`
	font-size: ${(props) => props.theme.typography.size.base} !important;
	font-weight: ${(props) => props.theme.typography.weight.bold} !important;
	font-family: ${(props) => props.theme.typography.family.alt1} !important;
	color: ${(props) => props.theme.colors.font.alt1} !important;
	margin: 0 0 15px 0 !important;
	padding: 0 0 15px 0;
	border-bottom: 1px dotted ${(props) => props.theme.colors.border.primary};
	color: ${(props) => props.theme.colors.font.primary} !important;
`;

export const TOCList = styled.ul`
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin: 0 !important;
	padding: 0 !important;
`;

export const TOCItem = styled.li<{ $active?: boolean }>`
	list-style: none !important;
	padding: 0 !important;
	margin: 0 !important;

	&::before {
		content: none !important;
	}

	a {
		font-size: ${(props) => props.theme.typography.size.xSmall} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		color: ${(props) => (props.$active ? props.theme.colors.font.alt5 : props.theme.colors.font.alt1)} !important;
		text-decoration: none !important;
		line-height: 1.65 !important;
		display: block;
		transition: all 0.2s ease;

		&:hover {
			color: ${(props) => props.theme.colors.font.primary} !important;
			border-left-color: ${(props) => props.theme.colors.font.primary.alt4};
		}
	}
`;

export const Wrapper = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 25px;
	order: 1;

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-size: clamp(32px, 3.75vw, 44px) !important;
		font-weight: ${(props) => props.theme.typography.weight.xBold} !important;
		font-family: ${(props) => props.theme.typography.family.alt1} !important;
		color: ${(props) => props.theme.colors.font.primary} !important;
		margin: 0 0 5px 0;
		padding: 0 0 2.5px 0;
	}

	h3,
	h4,
	h5,
	h6 {
	}

	h2 {
		font-size: clamp(22px, 3.15vw, 38px) !important;
		font-family: ${(props) => props.theme.typography.family.alt1} !important;
		scroll-margin-top: 100px;
		a {
			font-size: clamp(22px, 3.05vw, 34px) !important;
		}
	}

	h3,
	h4,
	h5 {
		font-size: clamp(18px, 2.5vw, 28px) !important;
	}

	h6 {
		font-size: clamp(16px, 1.95vw, 22px) !important;
		color: ${(props) => props.theme.colors.font.alt1} !important;
		border-bottom: 1px solid transparent;

		a {
			font-size: clamp(16px, 1.95vw, 22px) !important;
			text-decoration-thickness: 2px;
			&:hover {
				color: ${(props) => props.theme.colors.font.alt1};
				text-decoration-thickness: 2px;
			}
		}
	}

	strong,
	b {
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
	}

	p,
	span,
	li,
	div,
	pre {
		font-size: ${(props) => props.theme.typography.size.small} !important;
		font-weight: ${(props) => props.theme.typography.weight.medium} !important;
		font-family: ${(props) => props.theme.typography.family.primary} !important;
		color: ${(props) => props.theme.colors.font.alt1} !important;
		line-height: 1.65 !important;
	}

	a {
		font-size: ${(props) => props.theme.typography.size.small} !important;
		text-decoration: underline;
	}

	ol,
	ul {
		display: flex;
		flex-direction: column;
		gap: 7.5px;
		margin: -17.5px 0 0 0;

		li {
			list-style-type: none;
			padding: 0 0 0 20px;
			margin: 0 0 0 10px;
			position: relative;
		}

		ol,
		ul {
			margin: 7.5px 0 0 0;
		}
	}

	ul {
		li {
			&::before {
				content: '\u2022';
				position: absolute;
				left: 0;
				text-align: center;
			}
		}
	}

	ol {
		counter-reset: my-counter;
		li {
			&::before {
				counter-increment: my-counter;
				content: counter(my-counter) '. ';
				position: absolute;
				left: 0;
				text-align: center;
			}
		}
	}

	a {
		color: ${(props) => props.theme.colors.font.primary.alt4};
		&:hover {
			text-decoration-thickness: 1.65px;
		}
	}

	code {
		padding: 2.5px 5.5px !important;
		background: ${(props) => props.theme.colors.container.alt3.background} !important;
		border-radius: ${STYLING.dimensions.radius.alt3} !important;
		color: ${(props) => props.theme.colors.font.alt1} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-size: ${(props) => props.theme.typography.size.xxSmall} !important;
	}

	pre {
		padding: 10px !important;
		background: ${(props) => props.theme.colors.container.alt3.background} !important;
		border-radius: ${STYLING.dimensions.radius.primary} !important;
		overflow: auto;
		code {
			padding: 0 !important;
			background: ${(props) => props.theme.colors.transparent} !important;
			color: ${(props) => props.theme.colors.font.primary.alt1} !important;
			font-weight: ${(props) => props.theme.typography.weight.regular} !important;
			font-size: ${(props) => props.theme.typography.size.small} !important;
			border-radius: 0 !important;
			line-height: 1.5 !important;
		}
	}

	img {
		width: 100%;
		max-width: 700px;
		background: ${(props) => props.theme.colors.container.primary.background};
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		margin: 30px 0 0 0;
	}
`;

export const CodeBlock = styled.div`
	display: flex;
	justify-content: space-between;
	position: relative;
	margin: 0 !important;

	pre,
	code {
		padding: 0 !important;
		margin: 0 !important;
		background: ${(props) => props.theme.colors.transparent} !important;
		border: 1px solid ${(props) => props.theme.colors.transparent} !important;
		color: ${(props) => props.theme.colors.font.primary.alt1} !important;
		font-weight: ${(props) => props.theme.typography.weight.regular} !important;
		font-size: ${(props) => props.theme.typography.size.small} !important;
		border-radius: 0 !important;
		line-height: 1.5 !important;
	}

	div {
		margin: 0 !important;
	}

	button {
		margin: 1.5px 0 0 10px !important;
	}
`;

export const CopyIcon = styled.button<{
	dimensions: { wrapper: number; icon: number } | undefined;
}>`
	height: ${(props) => (props.dimensions ? `${props.dimensions.wrapper.toString()}px` : `32.5px`)};
	min-width: ${(props) => (props.dimensions ? `${props.dimensions.wrapper.toString()}px` : `32.5px`)};
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 2.5px 0 0 0;
	background: ${(props) => props.theme.colors.button.alt1.background};
	border-radius: ${STYLING.dimensions.radius.primary};
	position: relative;

	border: none;
	padding: 0;
	font: inherit;

	&:focus {
		outline: none;
		svg {
			opacity: ${(props) => (props.disabled ? '1' : '0.75')};
		}
	}

	&:hover {
		background: ${(props) => props.theme.colors.button.alt1.hover};
	}

	svg {
		height: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `17.5px`)};
		width: ${(props) => (props.dimensions ? `${props.dimensions.icon.toString()}px` : `17.5px`)};
		fill: ${(props) => props.theme.colors.button.alt1.label};
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		&:hover {
			cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
			opacity: 1;
		}
	}

	&:disabled {
		background: ${(props) => props.theme.colors.button.alt1.disabled.background};
		color: ${(props) => props.theme.colors.button.alt1.disabled.label};
		svg {
			fill: ${(props) => props.theme.colors.button.alt1.disabled.label};
		}
	}
`;
