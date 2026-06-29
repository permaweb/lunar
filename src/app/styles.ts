import styled, { createGlobalStyle, css, keyframes } from 'styled-components';

import { open, transition1, transition2 } from 'helpers/animations';
import { STYLING } from 'helpers/config';

const nodeStatusBlink = keyframes`
	0%,
	100% {
		opacity: 0.35;
		transform: scale(0.9);
	}

	50% {
		opacity: 0.85;
		transform: scale(1);
	}
`;

const nodeStatusPulse = keyframes`
	0% {
		box-shadow: 0 0 0 0 currentColor;
		transform: scale(0.96);
	}

	70% {
		box-shadow: 0 0 0 7px transparent;
		transform: scale(1);
	}

	100% {
		box-shadow: 0 0 0 0 transparent;
		transform: scale(0.96);
	}
`;

export const GlobalStyle = createGlobalStyle`
  html, body, div, span, applet, object, iframe,
  h1, h2, h3, h4, h5, h6, p, blockquote, pre,
  a, abbr, acronym, address, big, cite, code,
  del, dfn, em, img, ins, kbd, q, s, samp,
  small, strike, strong, sub, sup, tt, var,
  b, u, i, center,
  dl, dt, dd, ol, ul, li,
  fieldset, form, label, legend,
  caption, tbody, tfoot, thead, tr, th, td,
  article, aside, canvas, details, embed,
  figure, figcaption, footer, header, hgroup,
  menu, nav, output, ruby, section, summary,
  time, mark, audio, video {
    margin: 0;
    padding: 0;
    border: 0;
    font: inherit;
    vertical-align: baseline;
  }

  article, aside, details, figcaption, figure,
  footer, header, hgroup, menu, nav, section {
    display: block;
  }

  body {
		overflow-x: hidden;
    background: ${(props) => props.theme.colors.view.background};
  }

  ol, ul {
    list-style: none;
  }

  blockquote, q {
    quotes: none;
  }

  blockquote:before, blockquote:after,
  q:before, q:after {
    content: none;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
			margin: 0;
			color-scheme: ${(props) => props.theme.scheme};
			font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
			"Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
			sans-serif;
			font-family: ${(props) => props.theme.typography.family.primary};
			font-weight: ${(props) => props.theme.typography.weight.medium};
			color: ${(props) => props.theme.colors.font.primary};
			line-height: 1.5;
			letter-spacing: 0.15px;
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			box-sizing: border-box;
			
			scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} ${(props) => props.theme.colors.scrollbar.track};

			::-webkit-scrollbar-track {
				background: ${(props) => props.theme.colors.scrollbar.track};
			}
			::-webkit-scrollbar {
				width: 15px;
				border-left: 1px solid ${(props) => props.theme.colors.border.primary};
			}
			::-webkit-scrollbar-thumb {
				background-color: ${(props) => props.theme.colors.scrollbar.thumb};
				border-radius: 36px;
				border: 3.5px solid transparent;
				background-clip: padding-box;
			}
	}

  h1, h2, h3, h4, h5, h6 {
    font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
    color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
		line-height: 1.25;
		letter-spacing: 0.5px;
  }

	h1 {
    font-size: ${(props) => props.theme.typography.size.h1};
  }

  h2 {
    font-size: ${(props) => props.theme.typography.size.h2};
  }

  h4 {
    font-size: ${(props) => props.theme.typography.size.h4};
  }

  a, button {
    transition: all 100ms;
  }
  
  button {
    padding: 0;
    margin: 0;
    border: none;
    background: transparent;
    &:hover {
      cursor: pointer;
    }

    &:disabled {
      cursor: default;
    }
  }

  a {
    color: ${(props) => props.theme.colors.link.color};
    text-decoration: none;
    &:hover {
      color: ${(props) => props.theme.colors.link.active};
    }
  }

  input, textarea {
    box-shadow: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-color: transparent;
    margin: 0;
    padding: 10px;
    &:focus {
      outline: 0;
    }
    &:disabled {
      cursor: default;
    }
  }
  
  textarea {
    resize: none;
  }

  label {
    cursor: text;
  }

  b, strong {
    font-weight: ${(props) => props.theme.typography.weight.bold};
  }

  .border-wrapper-primary {
    background: ${(props) => props.theme.colors.container.primary.background};
    border: 1px solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
  }

  .border-wrapper-alt1 {
    background: ${(props) => props.theme.colors.container.primary.background};
    box-shadow: 0 3.5px 7.5px 0 ${(props) => props.theme.colors.shadow.primary};
    border: 1px solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
  }

	.border-wrapper-alt2 {
    background: ${(props) => props.theme.colors.container.primary.background};
    border: 1px solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
  }

	.border-wrapper-alt3 {
    background: ${(props) => props.theme.colors.container.alt1.background};
    border: 1px solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} 0px 1px 2px 0.5px;
  }

	.border-wrapper-alt4 {
		background: ${(props) => props.theme.colors.container.alt1.background};
		border: 1px solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.alt1};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} 0px 1px 2px 0.5px;
  }

  .max-view-wrapper {
    width: 100%;
    max-width: ${STYLING.cutoffs.max};
    margin: 0 auto;
  }

	.modal-wrapper {
		padding: 0 20px !important;
	}

  .info {
    padding: 2px 5px;
    background: ${(props) => props.theme.colors.contrast.background};
    border: 1px solid ${(props) => props.theme.colors.contrast.background};
    border-radius: ${STYLING.dimensions.radius.alt2};
    animation: ${open} ${transition2};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} 0px 1px 2px 0.5px;
    span {
      color: ${(props) => props.theme.colors.contrast.color} !important;
      font-family: ${(props) => props.theme.typography.family.primary} !important;
      font-size: ${(props) => props.theme.typography.size.xxxxSmall} !important;
      font-weight: ${(props) => props.theme.typography.weight.bold} !important;
			line-height: 1.1 !important;
			text-transform: none !important;
      white-space: nowrap !important;
	  }
  }

	.update-wrapper {
		width: fit-content;
		padding: 2.5px 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: ${(props) => props.theme.colors.container.alt8.background};
		border: 1px solid ${(props) => props.theme.colors.border.alt4};
		border-radius: ${STYLING.dimensions.radius.alt1};
		span {
			font-size: ${(props) => props.theme.typography.size.xxSmall};
			font-family: ${(props) => props.theme.typography.family.alt1};
			font-weight: ${(props) => props.theme.typography.weight.bold};
			color: ${(props) => props.theme.colors.font.light1};
			text-align: center;
		}
  }

  .overlay {
    min-height: 100vh;
    height: 100%;
    width: 100%;
    position: fixed;
    z-index: 11;
    top: 0;
    left: 0;
    background: ${(props) => props.theme.colors.overlay.primary};
  }

	.app-loader {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: ${open} ${transition2};
    svg {
      height: auto;
      width: 50px;
			fill: ${(props) => props.theme.colors.font.primary};
    }
  }

	.fade-in {
		animation: ${open} ${transition1};
	}

  .scroll-wrapper {
    overflow: auto;
    
    scrollbar-color: transparent transparent;
    ::-webkit-scrollbar {
      width: 12.5px;
    }
		scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} transparent;

    ::-webkit-scrollbar-thumb {
      background-color: transparent;
    }

		scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} transparent;

		::-webkit-scrollbar-thumb {
			background-color: ${(props) => props.theme.colors.scrollbar.thumb};
		}

    &:hover {
      scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} transparent;

      ::-webkit-scrollbar-thumb {
        background-color: ${(props) => props.theme.colors.scrollbar.thumb};
      }
    }
  }

	.scroll-wrapper-hidden {
			overflow: auto;

			::-webkit-scrollbar {
				display: none;
			}
			
			-ms-overflow-style: none;
			scrollbar-width: none;
		}
`;

export const App = styled.div`
	min-height: 100vh;
	position: relative;
	display: flex;
	flex-direction: column;
`;

export const NodeStatusButton = styled.button<{ $isLifted?: boolean }>`
	position: fixed;
	right: 20px;
	bottom: ${(props) => (props.$isLifted ? '80px' : '20px')};
	z-index: 10;
	max-width: min(360px, calc(100vw - 40px));
	display: flex;
	align-items: center;
	gap: 0;
	padding: 11.5px 14.5px 12.5px 14.5px;
	background: ${(props) => props.theme.colors.contrast.background};
	border: 1px solid ${(props) => props.theme.colors.contrast.border};
	border-radius: ${STYLING.dimensions.radius.primary};
	box-shadow: 0 3.5px 7.5px 0 ${(props) => props.theme.colors.shadow.primary};
	color: ${(props) => props.theme.colors.font.primary};
	text-align: left;
	transition: bottom 180ms ease, gap 180ms ease, background 100ms, border-color 100ms;

	&:hover,
	&:focus {
		gap: 12.5px;
		background: ${(props) => props.theme.colors.contrast.active.background};
		border-color: ${(props) => props.theme.colors.contrast.active.border};
		outline: none;

		> div:last-child {
			max-width: 270px;
			opacity: 1;
			visibility: visible;
			transition-delay: 0s;
		}
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		right: 12px;
		bottom: ${(props) => (props.$isLifted ? '84px' : '12px')};
		max-width: calc(100vw - 24px);
	}
`;

export const NodeStatusIndicator = styled.div<{ $isOnline: boolean; $isLoading: boolean }>`
	height: 10px;
	width: 10px;
	flex: none;
	border-radius: 50%;
	margin: 2.5px 0 0 0;
	color: ${(props) =>
		props.$isLoading
			? props.theme.colors.font.alt1
			: props.$isOnline
			? props.theme.colors.indicator.active
			: props.theme.colors.warning.primary};
	background: currentColor;
	opacity: ${(props) => (props.$isLoading ? 0.65 : 1)};
	will-change: box-shadow, opacity, transform;
	${(props) =>
		props.$isLoading
			? css`
					animation: ${nodeStatusBlink} 1s ease-in-out infinite;
			  `
			: css`
					animation: ${nodeStatusPulse} 1.8s ease-out infinite;
			  `}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`;

export const NodeStatusText = styled.div`
	min-width: 0;
	max-width: 0;
	display: flex;
	flex-direction: column;
	gap: 1px;
	opacity: 0;
	overflow: hidden;
	visibility: hidden;
	transition: max-width 180ms ease, opacity 120ms ease, visibility 0s linear 180ms;

	p {
		min-width: 0;
		overflow: hidden;
		color: ${(props) => props.theme.colors.contrast.color};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		line-height: 1.25;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

export const View = styled.main<{ navigationOpen: boolean }>`
	min-height: calc(100vh - ${STYLING.dimensions.nav.height});
	width: 100%;
	position: relative;
	padding: 0 0 20px 0;
	margin: 0 auto;
	display: flex;
	flex-direction: column;
`;

export const CenteredWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.colors.view.background};
`;

export const ViewWrapper = styled.div`
	width: 100%;
	max-width: ${STYLING.cutoffs.max};
	padding: 0 25px;
	margin: 0 auto;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 0 15px;
	}
`;

export const MessageWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 20px;
	padding: 12.5px 30px;

	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const Footer = styled.footer<{ navigationOpen: boolean }>`
	width: 100%;
	display: flex;
	gap: 15px;
	align-items: center;
	justify-content: space-between;
	margin: 20px 0 0 0;
	padding: 30px 50px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};

	p {
		display: flex;
		align-items: center;
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
	}

	a {
		display: flex;
		align-items: center;
		gap: 3.5px;
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.primary};
		text-decoration: underline;
		text-decoration-thickness: 1.25px;

		&:hover {
			color: ${(props) => props.theme.colors.link.color} !important;
		}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		padding: 20px 0;
	}
`;

export const FooterIcon = styled.span`
	height: 16px;
	width: 16px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin: 0 6px 0 0;

	> span,
	div {
		height: 16px;
		width: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	svg {
		height: 16px;
		width: 16px;
		color: ${(props) => props.theme.colors.font.primary};
		fill: ${(props) => props.theme.colors.font.primary};
	}

	svg path {
		color: ${(props) => props.theme.colors.font.primary};
		fill: ${(props) => props.theme.colors.font.primary};
	}

	&.app-icon {
		margin: 0 10.5px -2.5px 0;
	}

	&.ar-icon,
	&.ar-icon div,
	&.ar-icon svg {
		height: 14px;
		width: 14px;
	}
`;
