import styled from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Container = styled.div<{ $embedded?: boolean; $fixedHeight?: number; $fullScreenMode?: boolean }>`
	height: ${(props) =>
		props.$fullScreenMode
			? '100vh'
			: props.$fixedHeight
			? `${props.$fixedHeight}px`
			: props.$embedded
			? `${CSS_DIMENSIONS.px600}`
			: 'auto'};
	min-height: ${(props) => (props.$embedded ? `${CSS_DIMENSIONS.px125}` : '0')};
	width: ${(props) => (props.$fullScreenMode ? '100vw' : '100%')};
	max-width: ${(props) => (props.$fullScreenMode ? '100vw' : props.$embedded ? '100%' : `${CSS_DIMENSIONS.px750}`)};
	flex: 1;
	display: flex;
	flex-direction: column;
	order: 1;
	padding: ${(props) => (props.$fullScreenMode ? '0' : props.$embedded ? '0' : `${CSS_DIMENSIONS.px15} 0 0 0`)};
	margin: ${(props) => (props.$fullScreenMode ? '0' : props.$embedded ? '0' : '0 auto')};
	overflow: ${(props) => (props.$embedded ? 'hidden' : 'visible')};
	z-index: ${(props) => (props.$fullScreenMode ? '999' : 'auto')};

	@media (max-width: ${CSS_DIMENSIONS.px1024}) {
		max-width: ${(props) => (props.$fullScreenMode ? '100vw' : '100%')};
		padding: ${(props) => (props.$fullScreenMode ? '0' : props.$embedded ? '0' : `0 ${CSS_DIMENSIONS.px5}`)};
	}
`;

export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: ${CSS_DIMENSIONS.px15};
	padding: ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px15} ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px15};

	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const ActionsWrapper = styled.div`
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px7_5};
`;

export const Content = styled.div<{ $compact?: boolean; $embedded?: boolean; $fullScreenMode?: boolean }>`
	min-height: 0;
	min-width: 0;
	display: flex;
	flex: ${(props) => (props.$fullScreenMode || props.$embedded ? '1' : 'initial')};
	flex-direction: column;
	gap: ${(props) => (props.$embedded ? `${CSS_DIMENSIONS.px17_5}` : `${CSS_DIMENSIONS.px25}`)};
	padding: ${(props) =>
		props.$fullScreenMode ? `${CSS_DIMENSIONS.px20}` : props.$embedded ? `${CSS_DIMENSIONS.px15}` : '0'};
	overflow: ${(props) => (props.$fullScreenMode || props.$embedded ? 'auto' : 'visible')};
	overflow-wrap: anywhere;

	* {
		overflow-wrap: anywhere !important;
	}

	hr {
		margin: ${CSS_DIMENSIONS.px12_5} 0;
		border: 0;
		border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}

	table {
		width: 100%;
		max-width: 100%;
		table-layout: fixed;
		border-collapse: separate;
		border-spacing: 0;
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		background: ${(props) => props.theme.colors.container.alt1.background};
		overflow: hidden;

		thead {
			background: ${(props) => props.theme.colors.container.alt2.background};
		}

		th,
		td {
			padding: ${CSS_DIMENSIONS.px7_5} ${CSS_DIMENSIONS.px10};
			border-right: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
			border-bottom: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
			font-size: ${(props) => props.theme.typography.size.xxSmall};
			text-align: left;
			overflow-wrap: anywhere;
			word-break: break-word;

			&:last-child {
				border-right: none;
			}
		}

		th {
			color: ${(props) => props.theme.colors.font.primary};
			font-weight: ${(props) => props.theme.typography.weight.bold};
		}

		tr:last-child td {
			border-bottom: none;
		}
	}

	h1,
	h2,
	h3,
	h4,
	h5,
	h6 {
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-family: ${(props) => props.theme.typography.family.alt1} !important;
		color: ${(props) => props.theme.colors.font.primary} !important;
		padding: 0 0 ${CSS_DIMENSIONS.px2_5} 0;

		code {
			font-size: inherit !important;
			line-height: inherit !important;
		}
	}

	h1 {
		font-size: ${(props) =>
			props.$compact
				? `clamp(${CSS_DIMENSIONS.px22}, 2.4vw, ${CSS_DIMENSIONS.px26})`
				: `clamp(${CSS_DIMENSIONS.px32}, 3.25vw, ${CSS_DIMENSIONS.px36})`} !important;
	}

	h2 {
		font-size: ${(props) =>
			props.$compact
				? `clamp(${CSS_DIMENSIONS.px20}, 2.2vw, ${CSS_DIMENSIONS.px24})`
				: `clamp(${CSS_DIMENSIONS.px30}, 3.15vw, ${CSS_DIMENSIONS.px34})`} !important;
		scroll-margin-top: ${CSS_DIMENSIONS.px100};

		a {
			font-size: inherit !important;
		}
	}

	h3 {
		font-size: ${(props) =>
			props.$compact
				? `clamp(${CSS_DIMENSIONS.px18}, 2vw, ${CSS_DIMENSIONS.px21})`
				: `clamp(${CSS_DIMENSIONS.px18}, 2.5vw, ${CSS_DIMENSIONS.px28})`} !important;
	}

	h4 {
		font-size: ${(props) =>
			props.$compact
				? `clamp(${CSS_DIMENSIONS.px16}, 1.8vw, ${CSS_DIMENSIONS.px19})`
				: `clamp(${CSS_DIMENSIONS.px18}, 2.5vw, ${CSS_DIMENSIONS.px28})`} !important;
		scroll-margin-top: ${CSS_DIMENSIONS.px100};
	}

	h5 {
		font-size: ${(props) =>
			props.$compact
				? `clamp(${CSS_DIMENSIONS.px15}, 1.6vw, ${CSS_DIMENSIONS.px17})`
				: `clamp(${CSS_DIMENSIONS.px18}, 2.5vw, ${CSS_DIMENSIONS.px28})`} !important;
	}

	h6 {
		font-size: ${(props) =>
			props.$compact
				? `clamp(${CSS_DIMENSIONS.px14}, 1.4vw, ${CSS_DIMENSIONS.px16})`
				: `clamp(${CSS_DIMENSIONS.px16}, 1.95vw, ${CSS_DIMENSIONS.px22})`} !important;
		color: ${(props) => props.theme.colors.font.alt1} !important;
		border-bottom: ${CSS_DIMENSIONS.px1} solid transparent;

		a {
			font-size: inherit !important;
			text-decoration-thickness: ${CSS_DIMENSIONS.px2};
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
		color: ${(props) => props.theme.colors.font.primary.alt4};
		text-decoration: underline;

		&:hover {
			text-decoration-thickness: ${CSS_DIMENSIONS.px1_65};
		}
	}

	blockquote {
		padding: ${CSS_DIMENSIONS.px2_5} 0 ${CSS_DIMENSIONS.px2_5} ${CSS_DIMENSIONS.px15};
		border-left: ${CSS_DIMENSIONS.px3} solid ${(props) => props.theme.colors.border.primary};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	ol,
	ul {
		display: flex;
		flex-direction: column;
		gap: ${CSS_DIMENSIONS.px7_5};
		margin: ${(props) => (props.$embedded ? '0' : `-${CSS_DIMENSIONS.px17_5} 0 0 0`)};
		white-space: normal;

		li {
			list-style-type: none;
			padding: 0;
			margin: 0 0 0 ${CSS_DIMENSIONS.px30};
			position: relative;
			white-space: normal;

			> p {
				margin: 0;
			}

			> p:first-child {
				display: inline;
			}
		}

		ol,
		ul {
			margin: ${CSS_DIMENSIONS.px7_5} 0 0 0;
		}
	}

	ul li::before {
		content: '\u2022';
		position: absolute;
		left: -${CSS_DIMENSIONS.px20};
	}

	ol {
		counter-reset: my-counter;

		li::before {
			counter-increment: my-counter;
			content: counter(my-counter) '. ';
			position: absolute;
			left: -${CSS_DIMENSIONS.px30};
			width: ${CSS_DIMENSIONS.px25};
			text-align: right;
		}

		ul li::before {
			counter-increment: none;
			content: '\u2022';
		}
	}

	li.task-list-item {
		margin-left: 0;
		padding-left: ${CSS_DIMENSIONS.px25};

		&::before {
			content: none;
		}

		input {
			position: absolute;
			left: 0;
			top: ${CSS_DIMENSIONS.px4};
		}
	}

	code {
		max-width: 100%;
		padding: ${CSS_DIMENSIONS.px1_5} ${CSS_DIMENSIONS.px5_5} ${CSS_DIMENSIONS.px2_5} ${CSS_DIMENSIONS.px5_5} !important;
		background: ${(props) => props.theme.colors.container.alt2.background} !important;
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
		border-radius: ${STYLING.dimensions.radius.alt2} !important;
		color: ${(props) => props.theme.colors.font.primary} !important;
		font-weight: ${(props) => props.theme.typography.weight.bold} !important;
		font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
		font-family: ${(props) => props.theme.typography.family.alt2} !important;
	}

	pre {
		width: 100%;
		height: auto !important;
		max-height: none !important;
		flex: 0 0 auto;
		line-height: 1.5 !important;

		code,
		span {
			color: ${(props) => props.theme.colors.editor.primary} !important;
			font-size: ${(props) => props.theme.typography.size.xxxSmall} !important;
			font-weight: ${(props) => props.theme.typography.weight.bold} !important;
			font-family: ${(props) => props.theme.typography.family.alt2} !important;
			letter-spacing: 0;
		}

		code {
			padding: 0 !important;
			background: transparent !important;
			border: none !important;
			color: ${(props) => props.theme.colors.font.primary} !important;
			font-weight: ${(props) => props.theme.typography.weight.medium} !important;
			border-radius: 0 !important;
			line-height: 1.5 !important;

			&[class*='language-'] {
				color: ${(props) => props.theme.colors.editor.primary} !important;
			}

			.token.property,
			.token.tag,
			.token.attr-name,
			.token.selector,
			.token.builtin,
			.token.constant,
			.token.symbol,
			.token.deleted,
			.token.function,
			.token.class-name {
				color: ${(props) => props.theme.colors.editor.alt5} !important;
			}

			.token.string,
			.token.char,
			.token.attr-value,
			.token.inserted {
				color: ${(props) => props.theme.colors.editor.primary} !important;
			}

			.token.number,
			.token.boolean {
				color: ${(props) => props.theme.colors.editor.alt8} !important;
			}

			.token.comment,
			.token.prolog,
			.token.doctype,
			.token.cdata,
			.token.punctuation,
			.token.keyword,
			.token.operator,
			.token.null {
				color: ${(props) => props.theme.colors.font.alt1} !important;
			}

			&.language-diff,
			&[class*='language-diff'] {
				.token.deleted,
				.token.deleted-sign {
					color: ${(props) => props.theme.colors.warning.primary} !important;
				}

				.token.inserted,
				.token.inserted-sign {
					color: ${(props) => props.theme.colors.indicator.active} !important;
				}
			}
		}
	}

	img {
		width: 100%;
		max-width: ${CSS_DIMENSIONS.px700};
		max-height: ${(props) => (props.$embedded ? `calc(100vh - ${CSS_DIMENSIONS.px245})` : 'none')};
		height: auto;
		object-fit: contain;
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px1}
			${CSS_DIMENSIONS.px2} ${CSS_DIMENSIONS.px0_5};
		margin: -${CSS_DIMENSIONS.px15} auto 0 auto;
	}
`;

export const CodeBlockWrapper = styled.div`
	&& {
		width: 100%;
		max-width: 100%;
		flex: 0 0 auto;
		position: relative;
		background: ${(props) => props.theme.colors.container.alt1.background} !important;
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary} !important;
		border-radius: ${STYLING.dimensions.radius.primary} !important;
		overflow: hidden;
	}
`;

export const CodeBlockContent = styled.pre`
	&& {
		width: 100%;
		height: auto !important;
		max-height: none !important;
		flex: 0 0 auto;
		margin: 0 !important;
		padding: ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px45} ${CSS_DIMENSIONS.px10} ${CSS_DIMENSIONS.px15} !important;
		background: transparent !important;
		border: none !important;
		border-radius: 0 !important;
		overflow-x: auto;
		overflow-y: visible;
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.5 !important;

		> div {
			margin: 0 !important;
		}
	}
`;

export const CodeBlockCopyButton = styled(PrimitiveButton)<{ $copied: boolean }>`
	position: absolute;
	top: ${CSS_DIMENSIONS.px8_5};
	right: ${CSS_DIMENSIONS.px7_5};
	z-index: 2;
	height: ${CSS_DIMENSIONS.px28};
	width: ${CSS_DIMENSIONS.px28};
	min-width: ${CSS_DIMENSIONS.px28};
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	background: ${(props) =>
		props.$copied ? props.theme.colors.button.primary.active.background : props.theme.colors.button.primary.background};
	border: ${CSS_DIMENSIONS.px1} solid
		${(props) =>
			props.$copied ? props.theme.colors.button.primary.active.border : props.theme.colors.button.primary.border};
	border-radius: ${STYLING.dimensions.radius.alt2};
	color: ${(props) => props.theme.colors.font.primary};
	cursor: pointer;
	opacity: 0.8;
	transition: background 100ms, border-color 100ms, opacity 100ms;

	&:hover,
	&:focus {
		background: ${(props) => props.theme.colors.button.primary.active.background};
		border-color: ${(props) => props.theme.colors.button.primary.active.border};
		opacity: 1;
		outline: none;
	}

	div,
	span {
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		line-height: 1 !important;
	}

	svg {
		height: ${CSS_DIMENSIONS.px15};
		width: ${CSS_DIMENSIONS.px15};
		color: currentColor;
		fill: currentColor;
	}
`;
