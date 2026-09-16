import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.footer`
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	gap: 15px;
	justify-content: space-between;
	margin: 20px 0 0 0;
	padding: 30px 50px;
	border-top: 1px solid ${(props) => props.theme.colors.border.primary};

	@media (max-width: ${STYLING.cutoffs.desktop}) {
		padding: 20px 0;
		flex-direction: column;
		align-items: center;
	}
`;

export const Section = styled.div`
	display: flex;
`;

const Text = styled.p`
	display: flex;
	align-items: center;
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.medium};
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const Info = styled(Text)``;

export const Links = styled(Text)`
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
`;

export const Deployment = styled.div`
	display: flex;
	align-items: center;
	gap: 8.5px;

	> span {
		font-size: ${(props) => props.theme.typography.size.xxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		color: ${(props) => props.theme.colors.font.alt1};
	}
`;

export const DeploymentFallback = styled.p`
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const Icon = styled.span`
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
`;
