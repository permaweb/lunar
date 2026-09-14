import styled from 'styled-components';

import { STYLING } from 'helpers/config';

export const InitialLoading = styled.div`
	min-height: 140px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 15px;
	text-align: center;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.small};
`;
export const InitialSpinner = styled.div`
	height: 50px;
	width: 50px;
	flex: 0 0 50px;
`;
export const Container = styled.section`
	width: 100%;
	border: 1px solid ${(props) => props.theme.colors.border.primary};
	border-radius: ${STYLING.dimensions.radius.alt1};
	overflow: hidden;
`;
export const Header = styled.div<{ $showMap: boolean }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 40px;
	padding: 15px;
	background: ${(props) => (props.$showMap ? props.theme.colors.container.alt1.background : 'transparent')};
	@media (max-width: ${STYLING.cutoffs.tablet}) {
		align-items: flex-start;
		flex-direction: column;
		gap: 15px;
	}
`;
export const Heading = styled.h2`
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: ${(props) => props.theme.typography.size.lg};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.primary};
`;
export const Count = styled.span`
	font-size: ${(props) => props.theme.typography.size.small};
	color: ${(props) => props.theme.colors.font.alt1};
`;
export const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: 12.5px;
	flex-wrap: wrap;
`;
export const Divider = styled.div`
	height: 20px;
	width: 1px;
	border-right: 1px solid ${(props) => props.theme.colors.border.primary};
	@media (max-width: ${STYLING.cutoffs.secondary}) {
		display: none;
	}
`;
export const Message = styled.p`
	padding: 30px 15px;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.small};
`;
export const Footer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 15px;
	padding: 15px;
	background: ${(props) => props.theme.colors.container.alt1.background};
`;
export const PageCount = styled.span`
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	color: ${(props) => props.theme.colors.font.alt1};
`;
