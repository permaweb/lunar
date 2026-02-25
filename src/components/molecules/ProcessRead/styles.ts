import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const Wrapper = styled.div`
	width: 100%;
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 25px;
`;

export const SectionWrapper = styled.div`
	width: 100%;
	padding: 15px;
	position: relative;
`;

export const SectionWrapperFull = styled(SectionWrapper)`
	padding: 0;
`;

export const OutputWrapper = styled(SectionWrapperFull)``;

export const Header = styled.div`
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 0 15px 0;
	p {
		font-size: ${(props) => props.theme.typography.size.lg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.primary};
	}
`;

export const HeaderAlt = styled(Header)`
	margin: 0;
`;

export const HeaderMain = styled.div`
	display: flex;
	align-items: center;
	gap: 5px;
`;

export const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
`;

export const Section = styled.div``;

export const SectionHeader = styled.div`
	margin: 0 0 5px 0;
	p {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const SectionBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2.5px;
`;

export const Line = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;

	p,
	span {
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}

	p {
		color: ${(props) => props.theme.colors.font.primary};
		text-align: right;
	}

	span {
		color: ${(props) => props.theme.colors.font.alt1};
	}

	@media (max-width: ${STYLING.cutoffs.secondary}) {
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: 5px;

		p {
			text-align: left;
		}
	}
`;

export const Output = styled(Body)`
	max-height: 500px;
`;

export const JSONTree = styled.div`
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
`;

export const UpdateWrapper = styled.div`
	margin: 15px 0 0 0;
	p {
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.medium};
		font-size: ${(props) => props.theme.typography.size.xSmall};
	}
`;

export const Error = styled(Line)`
	p,
	span {
		color: ${(props) => props.theme.colors.warning.primary};
	}
`;

export const LoadingWrapper = styled.div`
	position: absolute;
	bottom: 0;
	right: 0;
	z-index: 0;
`;
