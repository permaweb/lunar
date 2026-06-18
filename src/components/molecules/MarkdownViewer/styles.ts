import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Container = styled.div<{ $embedded?: boolean; $fixedHeight?: number; $fullScreenMode?: boolean }>`
	height: ${(props) =>
		props.$fullScreenMode
			? '100vh'
			: props.$fixedHeight
			? `${props.$fixedHeight}px`
			: props.$embedded
			? '600px'
			: 'auto'};
	min-height: ${(props) => (props.$embedded ? '125px' : '0')};
	width: ${(props) => (props.$fullScreenMode ? '100vw' : '100%')};
	max-width: ${(props) => (props.$fullScreenMode ? '100vw' : props.$embedded ? '100%' : '750px')};
	flex: 1;
	display: flex;
	flex-direction: column;
	order: 1;
	padding: ${(props) => (props.$fullScreenMode ? '0' : props.$embedded ? '0' : '15px 0 0 0')};
	margin: ${(props) => (props.$fullScreenMode ? '0' : props.$embedded ? '0' : '0 auto')};
	overflow: ${(props) => (props.$embedded ? 'hidden' : 'visible')};
	z-index: ${(props) => (props.$fullScreenMode ? '999' : 'auto')};

	@media (max-width: 1024px) {
		max-width: ${(props) => (props.$fullScreenMode ? '100vw' : '100%')};
		padding: ${(props) => (props.$fullScreenMode ? '0' : props.$embedded ? '0' : '0 5px')};
	}
`;

export const Header = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 15px;
	padding: 15px 15px 12.5px 15px;

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
	gap: 7.5px;
`;

export const Content = styled.div<{ $compact?: boolean; $embedded?: boolean; $fullScreenMode?: boolean }>`
	min-height: 0;
	min-width: 0;
	display: flex;
	flex: ${(props) => (props.$fullScreenMode || props.$embedded ? '1' : 'initial')};
	flex-direction: column;
	gap: ${(props) => (props.$embedded ? '17.5px' : '25px')};
	padding: ${(props) => (props.$fullScreenMode ? '20px' : props.$embedded ? '15px' : '0')};
	overflow: ${(props) => (props.$fullScreenMode || props.$embedded ? 'auto' : 'visible')};
	overflow-wrap: anywhere;

	* {
		overflow-wrap: anywhere !important;
	}

	hr {
		margin: 12.5px 0;
		border: 0;
		border-top: 1px solid ${(props) => props.theme.colors.border.primary};
	}

	table {
		width: 100%;
		max-width: 100%;
		table-layout: fixed;
		border-collapse: separate;
		border-spacing: 0;
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		background: ${(props) => props.theme.colors.container.alt1.background};
		overflow: hidden;

		thead {
			background: ${(props) => props.theme.colors.container.alt2.background};
		}

		th,
		td {
			padding: 7.5px 10px;
			border-right: 1px solid ${(props) => props.theme.colors.border.primary};
			border-bottom: 1px solid ${(props) => props.theme.colors.border.primary};
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
		padding: 0 0 2.5px 0;

		code {
			font-size: inherit !important;
			line-height: inherit !important;
		}
	}

	h1 {
		font-size: ${(props) => (props.$compact ? 'clamp(22px, 2.4vw, 26px)' : 'clamp(32px, 3.25vw, 36px)')} !important;
	}

	h2 {
		font-size: ${(props) => (props.$compact ? 'clamp(20px, 2.2vw, 24px)' : 'clamp(30px, 3.15vw, 34px)')} !important;
		scroll-margin-top: 100px;

		a {
			font-size: inherit !important;
		}
	}

	h3 {
		font-size: ${(props) => (props.$compact ? 'clamp(18px, 2vw, 21px)' : 'clamp(18px, 2.5vw, 28px)')} !important;
	}

	h4 {
		font-size: ${(props) => (props.$compact ? 'clamp(16px, 1.8vw, 19px)' : 'clamp(18px, 2.5vw, 28px)')} !important;
		scroll-margin-top: 100px;
	}

	h5 {
		font-size: ${(props) => (props.$compact ? 'clamp(15px, 1.6vw, 17px)' : 'clamp(18px, 2.5vw, 28px)')} !important;
	}

	h6 {
		font-size: ${(props) => (props.$compact ? 'clamp(14px, 1.4vw, 16px)' : 'clamp(16px, 1.95vw, 22px)')} !important;
		color: ${(props) => props.theme.colors.font.alt1} !important;
		border-bottom: 1px solid transparent;

		a {
			font-size: inherit !important;
			text-decoration-thickness: 2px;
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
			text-decoration-thickness: 1.65px;
		}
	}

	blockquote {
		padding: 2.5px 0 2.5px 15px;
		border-left: 3px solid ${(props) => props.theme.colors.border.primary};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	ol,
	ul {
		display: flex;
		flex-direction: column;
		gap: 7.5px;
		margin: ${(props) => (props.$embedded ? '0' : '-17.5px 0 0 0')};
		white-space: normal;

		li {
			list-style-type: none;
			padding: 0;
			margin: 0 0 0 30px;
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
			margin: 7.5px 0 0 0;
		}
	}

	ul li::before {
		content: '\u2022';
		position: absolute;
		left: -20px;
	}

	ol {
		counter-reset: my-counter;

		li::before {
			counter-increment: my-counter;
			content: counter(my-counter) '. ';
			position: absolute;
			left: -30px;
			width: 25px;
			text-align: right;
		}

		ul li::before {
			counter-increment: none;
			content: '\u2022';
		}
	}

	li.task-list-item {
		margin-left: 0;
		padding-left: 25px;

		&::before {
			content: none;
		}

		input {
			position: absolute;
			left: 0;
			top: 4px;
		}
	}

	code {
		max-width: 100%;
		padding: 1.5px 5.5px 2.5px 5.5px !important;
		background: ${(props) => props.theme.colors.container.alt2.background} !important;
		border: 1px solid ${(props) => props.theme.colors.border.primary} !important;
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
		max-width: 700px;
		max-height: ${(props) => (props.$embedded ? 'calc(100vh - 245px)' : 'none')};
		height: auto;
		object-fit: contain;
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.primary};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} 0px 1px 2px 0.5px;
		margin: -15px auto 0 auto;
	}
`;

export const CodeBlockWrapper = styled.div`
	&& {
		width: 100%;
		max-width: 100%;
		flex: 0 0 auto;
		position: relative;
		background: ${(props) => props.theme.colors.container.alt1.background} !important;
		border: 1px solid ${(props) => props.theme.colors.border.primary} !important;
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
		padding: 10px 45px 10px 15px !important;
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

export const CodeBlockCopyButton = styled.button<{ $copied: boolean }>`
	position: absolute;
	top: 8.5px;
	right: 7.5px;
	z-index: 2;
	height: 28px;
	width: 28px;
	min-width: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	background: ${(props) =>
		props.$copied ? props.theme.colors.button.primary.active.background : props.theme.colors.button.primary.background};
	border: 1px solid
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
		height: 15px;
		width: 15px;
		color: currentColor;
		fill: currentColor;
	}
`;
