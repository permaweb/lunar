import styled from 'styled-components';

import { CSS_DIMENSIONS } from 'helpers/themes';

export const Wrapper = styled.div<{ noWrapper?: boolean; fixedHeight?: number }>`
	padding: ${(props) => (props.noWrapper ? '0' : `${CSS_DIMENSIONS.px15}`)};
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	letter-spacing: 0;
	position: relative;
	min-width: 0;
	${(props) => props.fixedHeight && `height: ${props.fixedHeight}px;`}

	ul {
		margin: 0 0 0 ${CSS_DIMENSIONS.px1_5} !important;
	}
`;

export const JSONWrapper = styled.div`
	height: 100%;
`;

export const Header = styled.div`
	height: ${CSS_DIMENSIONS.px32_5};
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
	margin: ${CSS_DIMENSIONS.px10} 0 0 0;
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
	gap: ${CSS_DIMENSIONS.px15};
`;

export const JSONViewerRoot = styled.div<{ fullScreenMode: boolean; maxHeight?: number; fixedHeight?: number }>`
	height: ${(props) =>
		props.fixedHeight
			? `calc(${props.fixedHeight}px - ${CSS_DIMENSIONS.px32_5} - ${CSS_DIMENSIONS.px30})`
			: `calc(100% - ${CSS_DIMENSIONS.px32_5})`};
	max-height: ${(props) =>
		props.maxHeight
			? `calc(${props.maxHeight.toString()}px - ${CSS_DIMENSIONS.px32_5} - ${CSS_DIMENSIONS.px30})`
			: 'none'};
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	line-height: 1.6;
	color: ${(props) => props.theme.colors.editor.primary};
	min-width: 0;
	overflow-x: auto;
	overflow-y: auto;
`;

export const JSONIndent = styled.div`
	padding-left: ${CSS_DIMENSIONS.px22_5};
`;

export const JSONProperty = styled.div`
	display: block;
	position: relative;
`;

export const CollapseArrow = styled.span<{ isCollapsed: boolean }>`
	display: inline-flex;
	position: absolute;
	top: -${CSS_DIMENSIONS.px4_5};
	left: -${CSS_DIMENSIONS.px12_5};
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
	margin-right: ${CSS_DIMENSIONS.px4};
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

export const LuaBlock = styled.div`
	display: block;
	max-width: min(${CSS_DIMENSIONS.px980}, 100%);
	margin: ${CSS_DIMENSIONS.px5} 0 ${CSS_DIMENSIONS.px7_5} 0;
`;

export const LuaPre = styled.pre`
	margin: 0 0 0 ${CSS_DIMENSIONS.px25};
	color: ${(props) => props.theme.colors.editor.primary};
	font-family: ${(props) => props.theme.typography.family.alt2};
	font-size: ${(props) => props.theme.typography.size.xxSmall};
	font-weight: ${(props) => props.theme.typography.weight.bold};
	line-height: 1.55;
	white-space: pre;
`;

export const LuaToken = styled.span<{ $tokenType: string }>`
	color: ${(props) => {
		switch (props.$tokenType) {
			case 'comment':
				return props.theme.colors.font.alt1;
			case 'string':
				return props.theme.colors.editor.alt8;
			case 'function':
			case 'number':
			case 'literal':
				return props.theme.colors.editor.alt4;
			case 'keyword':
				return props.theme.colors.editor.alt5;
			case 'key':
				return props.theme.colors.editor.alt10;
			case 'punctuation':
				return props.theme.colors.font.alt1;
			default:
				return props.theme.colors.editor.primary;
		}
	}};
`;

export const JSONStringIDFlex = styled.span`
	display: inline-flex;
	align-items: center;
	gap: ${CSS_DIMENSIONS.px5};
	position: relative;
`;

export const JSONStringID = styled.span<{ copied?: boolean }>`
	color: ${(props) => props.theme.colors.editor.alt8};
	cursor: pointer;
	text-decoration: ${(props) => (props.copied ? 'none' : 'underline')};
	text-decoration-thickness: ${CSS_DIMENSIONS.px1_25};
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
			right: -${CSS_DIMENSIONS.px75};
			top: -${CSS_DIMENSIONS.px2_5};
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

export const LoadMoreItem = styled.div`
	display: block;
	margin: ${CSS_DIMENSIONS.px10} 0;
`;
