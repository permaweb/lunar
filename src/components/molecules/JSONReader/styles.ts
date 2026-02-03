import styled from 'styled-components';

export const Wrapper = styled.div<{ noWrapper?: boolean }>`
	padding: ${(props) => (props.noWrapper ? '0' : '15px')};
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	letter-spacing: 0;
	position: relative;

	ul {
		margin: 0 0 0 1.5px !important;
	}
`;

export const JSONWrapper = styled.div`
	height: 100%;
`;

export const Header = styled.div`
	height: 32.5px;
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	flex-wrap: wrap;
	p {
		color: ${(props) => props.theme.colors.font.primary};
		font-family: ${(props) => props.theme.typography.family.alt1};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		font-size: ${(props) => props.theme.typography.size.lg};
	}
`;

export const Placeholder = styled.div`
	margin: 10px 0 0 0;
	p {
		font-size: ${(props) => props.theme.typography.size.xxxSmall};
		font-family: ${(props) => props.theme.typography.family.primary};
		font-weight: ${(props) => props.theme.typography.weight.bold};
		color: ${(props) => props.theme.colors.font.alt1};
		text-transform: uppercase;
	}
`;

export const ActionsWrapper = styled.div`
	width: fit-content;
	display: flex;
	gap: 15px;

	button {
		padding: 5px 0 0 0 !important;
	}
`;

export const JSONViewerRoot = styled.div<{ fullScreenMode: boolean; maxHeight: number }>`
	height: calc(100% - 32.5px);
	max-height: ${(props) => (props.maxHeight ? `${props.maxHeight.toString()}px` : 'none')};
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	line-height: 1.6;
	color: ${(props) => props.theme.colors.editor.primary};
`;

export const JSONIndent = styled.div`
	padding-left: 22.5px;
`;

export const JSONProperty = styled.div`
	display: block;
	position: relative;
`;

export const CollapseArrow = styled.span<{ isCollapsed: boolean }>`
	display: inline-flex;
	position: absolute;
	top: -4.5px;
	left: -12.5px;
	color: ${(props) => props.theme.colors.font.alt1};
	font-size: ${(props) => props.theme.typography.size.base};
	transform: rotate(${(props) => (props.isCollapsed ? '0deg' : '90deg')});
	transition: all 100ms;

	&:hover {
		cursor: pointer;
		color: ${(props) => props.theme.colors.font.alt2};
	}
`;

export const JSONArrayItem = styled.div`
	display: block;
	position: relative;
`;

export const JSONValue = styled.span`
	display: inline;
`;

export const JSONKeyDefault = styled.span`
	color: ${(props) => props.theme.colors.editor.alt10};
	font-weight: ${(props) => props.theme.typography.weight.bold};
`;

export const JSONKey = styled.span`
	color: ${(props) => props.theme.colors.editor.alt5};
	font-weight: ${(props) => props.theme.typography.weight.bold};
`;

export const JSONColon = styled.span`
	color: ${(props) => props.theme.colors.editor.alt4};
	margin-right: 4px;
`;

export const JSONComma = styled.span`
	color: ${(props) => props.theme.colors.editor.alt5};
	&::before {
		content: '';
		display: inline;
	}
`;

export const JSONString = styled.span`
	color: ${(props) => props.theme.colors.editor.primary};
`;

export const JSONStringIDFlex = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	position: relative;
`;

export const JSONStringID = styled.span<{ copied?: boolean }>`
	color: ${(props) => props.theme.colors.editor.alt8};
	cursor: pointer;
	text-decoration: ${(props) => (props.copied ? 'none' : 'underline')};
	text-decoration-thickness: 1.25px;
	position: relative;
	transition: all 100ms;

	&:hover {
		opacity: 0.8;
		text-decoration: underline;
		text-decoration-style: solid;
	}

	${(props) =>
		props.copied &&
		`
		&::after {
			content: '✓';
			position: absolute;
			right: -75px;
			top: -2.5px;
			color: ${props.theme.colors.success};
			font-size: ${props.theme.typography.size.base};
		}
	`}
`;

export const JSONStringIDOpen = styled.div`
	display: inline-flex;
	font-size: ${(props) => props.theme.typography.size.xxxSmall};
	color: ${(props) => props.theme.colors.font.alt1};
	transition: all 100ms;

	&:hover {
		cursor: pointer;
		color: ${(props) => props.theme.colors.font.alt2};
	}
`;

export const JSONNumber = styled.span`
	color: ${(props) => props.theme.colors.editor.alt8};
`;

export const JSONBoolean = styled.span`
	color: ${(props) => props.theme.colors.editor.alt8};
`;

export const JSONNull = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const JSONUndefined = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const JSONBracket = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
	font-weight: ${(props) => props.theme.typography.weight.bold};
`;

export const JSONObjectWrapper = styled.div`
	display: block;
`;

export const JSONArrayWrapper = styled.div`
	display: block;
`;

export const JSONObject = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
`;

export const JSONArray = styled.span`
	color: ${(props) => props.theme.colors.font.alt1};
`;
