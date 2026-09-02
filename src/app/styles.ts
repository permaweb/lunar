import styled, { createGlobalStyle, css, keyframes } from 'styled-components';

import { PrimitiveButton } from 'components/atoms/PrimitiveButton';
import { open, transition1, transition2 } from 'helpers/animations';
import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

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
		box-shadow: 0 0 0 ${CSS_DIMENSIONS.px7} transparent;
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
			letter-spacing: ${CSS_DIMENSIONS.px0_15};
			-webkit-font-smoothing: antialiased;
			-moz-osx-font-smoothing: grayscale;
			box-sizing: border-box;
			
			scrollbar-color: ${(props) => props.theme.colors.scrollbar.thumb} ${(props) => props.theme.colors.scrollbar.track};

			::-webkit-scrollbar-track {
				background: ${(props) => props.theme.colors.scrollbar.track};
			}
			::-webkit-scrollbar {
				width: ${CSS_DIMENSIONS.px15};
				border-left: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
			}
			::-webkit-scrollbar-thumb {
				background-color: ${(props) => props.theme.colors.scrollbar.thumb};
				border-radius: ${CSS_DIMENSIONS.px36};
				border: ${CSS_DIMENSIONS.px3_5} solid transparent;
				background-clip: padding-box;
			}
	}

  h1, h2, h3, h4, h5, h6 {
    font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
    color: ${(props) => props.theme.colors.font.primary};
		overflow-wrap: anywhere;
		line-height: 1.25;
		letter-spacing: ${CSS_DIMENSIONS.px0_5};
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
    padding: ${CSS_DIMENSIONS.px10};
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
    border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
  }

  .border-wrapper-alt1 {
    background: ${(props) => props.theme.colors.container.primary.background};
    box-shadow: 0 ${CSS_DIMENSIONS.px3_5} ${CSS_DIMENSIONS.px7_5} 0 ${(props) => props.theme.colors.shadow.primary};
    border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
  }

	.border-wrapper-alt2 {
    background: ${(props) => props.theme.colors.container.primary.background};
    border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
  }

	.border-wrapper-alt3 {
    background: ${(props) => props.theme.colors.container.alt1.background};
    border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
    border-radius: ${STYLING.dimensions.radius.alt1};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px1} ${
	CSS_DIMENSIONS.px2
} ${CSS_DIMENSIONS.px0_5};
  }

	.border-wrapper-alt4 {
		background: ${(props) => props.theme.colors.container.alt1.background};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
		border-radius: ${STYLING.dimensions.radius.alt1};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px1} ${
	CSS_DIMENSIONS.px2
} ${CSS_DIMENSIONS.px0_5};
  }

  .max-view-wrapper {
    width: 100%;
    max-width: ${STYLING.cutoffs.max};
    margin: 0 auto;
  }

	.modal-wrapper {
		padding: 0 ${CSS_DIMENSIONS.px20} !important;
	}

  .info {
    padding: ${CSS_DIMENSIONS.px2} ${CSS_DIMENSIONS.px5};
    background: ${(props) => props.theme.colors.contrast.background};
    border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.contrast.background};
    border-radius: ${STYLING.dimensions.radius.alt2};
    animation: ${open} ${transition2};
		box-shadow: ${(props) => props.theme.colors.shadow.primary} ${CSS_DIMENSIONS.px0} ${CSS_DIMENSIONS.px1} ${
	CSS_DIMENSIONS.px2
} ${CSS_DIMENSIONS.px0_5};
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
		padding: ${CSS_DIMENSIONS.px2_5} ${CSS_DIMENSIONS.px40};
		display: flex;
		align-items: center;
		justify-content: center;
		background: ${(props) => props.theme.colors.container.alt8.background};
		border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.alt4};
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
      width: ${CSS_DIMENSIONS.px50};
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
      width: ${CSS_DIMENSIONS.px12_5};
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

export const NodeStatusButton = styled(PrimitiveButton)<{ $isLifted?: boolean }>`
	position: fixed;
	right: ${CSS_DIMENSIONS.px20};
	bottom: ${(props) => (props.$isLifted ? `${CSS_DIMENSIONS.px80}` : `${CSS_DIMENSIONS.px20}`)};
	z-index: 10;
	max-width: min(${CSS_DIMENSIONS.px360}, calc(100vw - ${CSS_DIMENSIONS.px40}));
	display: flex;
	align-items: center;
	gap: 0;
	padding: ${CSS_DIMENSIONS.px11_5} ${CSS_DIMENSIONS.px14_5} ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px14_5};
	background: ${(props) => props.theme.colors.contrast.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.contrast.border};
	border-radius: ${STYLING.dimensions.radius.primary};
	box-shadow: 0 ${CSS_DIMENSIONS.px3_5} ${CSS_DIMENSIONS.px7_5} 0 ${(props) => props.theme.colors.shadow.primary};
	color: ${(props) => props.theme.colors.font.primary};
	text-align: left;
	transition: bottom 180ms ease, gap 180ms ease, background 100ms, border-color 100ms;

	&:hover,
	&:focus {
		gap: ${CSS_DIMENSIONS.px12_5};
		background: ${(props) => props.theme.colors.contrast.active.background};
		border-color: ${(props) => props.theme.colors.contrast.active.border};
		outline: none;

		> div:last-child {
			max-width: ${CSS_DIMENSIONS.px270};
			opacity: 1;
			visibility: visible;
			transition-delay: 0s;
		}
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		right: ${CSS_DIMENSIONS.px12};
		bottom: ${(props) => (props.$isLifted ? `${CSS_DIMENSIONS.px84}` : `${CSS_DIMENSIONS.px12}`)};
		max-width: calc(100vw - ${CSS_DIMENSIONS.px24});
	}
`;

export const NodeStatusIndicator = styled.div<{ $isOnline: boolean; $isLoading: boolean }>`
	height: ${CSS_DIMENSIONS.px10};
	width: ${CSS_DIMENSIONS.px10};
	flex: none;
	border-radius: 50%;
	margin: ${CSS_DIMENSIONS.px2_5} 0 0 0;
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
			: props.$isOnline
			? css`
					animation: ${nodeStatusPulse} 1.8s ease-out infinite;
			  `
			: css`
					animation: none;
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
	gap: ${CSS_DIMENSIONS.px1};
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
	padding: 0 0 ${CSS_DIMENSIONS.px20} 0;
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
	padding: 0 ${CSS_DIMENSIONS.px25};
	margin: 0 auto;

	@media (max-width: ${STYLING.cutoffs.initial}) {
		padding: 0 ${CSS_DIMENSIONS.px15};
	}
`;

export const MessageWrapper = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${CSS_DIMENSIONS.px20};
	padding: ${CSS_DIMENSIONS.px12_5} ${CSS_DIMENSIONS.px30};

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
	gap: ${CSS_DIMENSIONS.px15};
	align-items: center;
	justify-content: space-between;
	margin: ${CSS_DIMENSIONS.px20} 0 0 0;
	padding: ${CSS_DIMENSIONS.px30} ${CSS_DIMENSIONS.px50};
	border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};

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
		gap: ${CSS_DIMENSIONS.px3_5};
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.primary};
		text-decoration: underline;
		text-decoration-thickness: ${CSS_DIMENSIONS.px1_25};

		&:hover {
			color: ${(props) => props.theme.colors.link.color} !important;
		}
	}

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		padding: ${CSS_DIMENSIONS.px20} 0;
	}
`;

export const FooterIcon = styled.span`
	height: ${CSS_DIMENSIONS.px16};
	width: ${CSS_DIMENSIONS.px16};
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin: 0 ${CSS_DIMENSIONS.px6} 0 0;

	> span,
	div {
		height: ${CSS_DIMENSIONS.px16};
		width: ${CSS_DIMENSIONS.px16};
		display: flex;
		align-items: center;
		justify-content: center;
	}

	svg {
		height: ${CSS_DIMENSIONS.px16};
		width: ${CSS_DIMENSIONS.px16};
		color: ${(props) => props.theme.colors.font.primary};
		fill: ${(props) => props.theme.colors.font.primary};
	}

	svg path {
		color: ${(props) => props.theme.colors.font.primary};
		fill: ${(props) => props.theme.colors.font.primary};
	}

	&.app-icon {
		margin: 0 ${CSS_DIMENSIONS.px10_5} -${CSS_DIMENSIONS.px2_5} 0;
	}

	&.ar-icon,
	&.ar-icon div,
	&.ar-icon svg {
		height: ${CSS_DIMENSIONS.px14};
		width: ${CSS_DIMENSIONS.px14};
	}
`;
