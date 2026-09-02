import styled from 'styled-components';

import { STYLING } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px25};
`;

export const NetworkWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
`;

export const MessagesWrapper = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	margin: ${CSS_DIMENSIONS.px15} 0 0 0;
`;

export const HeaderWrapper = styled.div``;

export const Subheader = styled.div`
	width: fit-content;
	padding: ${CSS_DIMENSIONS.px4_5} ${CSS_DIMENSIONS.px15};
	display: flex;
	align-items: center;
	justify-content: center;
	background: ${(props) => props.theme.colors.container.alt8.background};
	border: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.container.alt8.background};
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
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px40};
`;

export const BodyFlexWrapper = styled.div`
	width: 100%;
	display: flex;
	gap: ${CSS_DIMENSIONS.px25};
	margin: 0 0 ${CSS_DIMENSIONS.px30} 0;

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		flex-direction: column;
	}
`;

export const BodyFlexMetrics = styled.div`
	width: calc(100% - ${CSS_DIMENSIONS.px450});

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		width: 100%;
	}
`;

export const BodyFlexConnection = styled.div`
	width: ${CSS_DIMENSIONS.px450};

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		width: 100%;
	}
`;

export const SectionMain = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: ${CSS_DIMENSIONS.px20};
`;

export const SectionHeader = styled.div`
	p {
		font-size: ${(props) => props.theme.typography.size.xLg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const NodesWrapper = styled.div`
	margin: 0 0 ${CSS_DIMENSIONS.px30} 0;
`;

export const MetricsSectionWrapper = styled.div`
	margin: 0 0 ${CSS_DIMENSIONS.px30} 0;
`;

export const DividerWrapper = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px20};
	margin: 0 0 ${CSS_DIMENSIONS.px30} 0;

	.landing-divider {
		height: ${CSS_DIMENSIONS.px1};
		flex: 1;
		border-top: ${CSS_DIMENSIONS.px1} solid ${(props) => props.theme.colors.border.primary};
	}

	span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
		text-align: center;
	}
`;
