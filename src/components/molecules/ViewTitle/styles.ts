import styled from 'styled-components';

export const HeaderWrapper = styled.div<{ $layout: 'page' | 'section' }>`
	width: 100%;
	margin: ${(props) => (props.$layout === 'section' ? '0' : '13.5px 0 27.5px 0')};
`;

export const HeaderContent = styled.div<{ $variant: 'default' | 'subsection' | 'small' }>`
	width: 100%;
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 30px 40px;

	h1,
	h2,
	h3,
	h4 {
		line-height: 1;
		font-size: ${(props) =>
			props.$variant === 'small'
				? props.theme.typography.size.lg
				: props.$variant === 'subsection'
				? props.theme.typography.size.xLg
				: props.theme.typography.size.xxLg};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) =>
			props.$variant === 'small' ? props.theme.typography.weight.medium : props.theme.typography.weight.bold};
		color: ${(props) => (props.$variant === 'small' ? props.theme.colors.font.alt1 : props.theme.colors.font.primary)};
		letter-spacing: 0.5px;
	}
`;

export const HeaderActions = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 20px;
`;
