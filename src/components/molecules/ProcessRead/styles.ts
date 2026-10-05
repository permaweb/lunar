import styled from 'styled-components';

export const Wrapper = styled.div`
	width: 100%;
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12.5px;
`;

export const OutputWrapper = styled.div`
	width: 100%;
`;

export const ReadDetails = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const RunRow = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px 15px;

	> button {
		flex-shrink: 0;
	}
`;

export const RunStatus = styled.div<{ $status: 'idle' | 'loading' | 'success' | 'error' }>`
	min-width: 0;
	display: flex;
	align-items: center;
	gap: 9.5px;
	color: ${(props) =>
		props.$status === 'success'
			? props.theme.colors.indicator.active
			: props.$status === 'error'
			? props.theme.colors.warning.primary
			: props.theme.colors.font.alt1};

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const Actions = styled.div`
	margin-left: auto;
	display: flex;
	align-items: center;
	gap: 7.5px;
`;

export const Provider = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
`;

export const Divider = styled.span`
	min-width: 0;
	overflow-wrap: anywhere;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.xSmall};
	font-family: ${(props) => props.theme.typography.family.primary};
	font-weight: ${(props) => props.theme.typography.weight.bold};
`;

export const LoadMore = styled.div`
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 10px;
	margin-top: 15px;

	span {
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall};
	}
`;

export const LogEntries = styled.div`
	display: flex;
	flex-direction: column;
	gap: 7.5px;
`;

export const Line = styled.div`
	span {
		overflow-wrap: anywhere;
		color: ${(props) => props.theme.colors.font.alt1};
		font-size: ${(props) => props.theme.typography.size.xSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
	}
`;

export const Error = styled(Line)`
	span {
		color: ${(props) => props.theme.colors.warning.primary};
	}
`;
