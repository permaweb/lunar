import styled from 'styled-components';

// Process names are user-defined, so keep a long one from pushing the header subject out of the panel.
export const Name = styled.p`
	max-width: 100%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`;
