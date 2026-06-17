import { DefaultTheme } from 'styled-components';

const definedThemeSignatures = new Map<string, string>();

function stripHex(color: string): string {
	return color.replace(/^#/, '');
}

function normalizeHex(color: string, fallback: string): string {
	const strippedColor = stripHex(color).trim();

	if (/^[0-9a-fA-F]{3}$/.test(strippedColor)) {
		return strippedColor
			.split('')
			.map((value) => `${value}${value}`)
			.join('');
	}

	if (/^[0-9a-fA-F]{6}$/.test(strippedColor)) {
		return strippedColor;
	}

	return stripHex(fallback).slice(0, 6);
}

function hexWithAlpha(color: string, alpha: number, fallback: string): string {
	const alphaHex = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
		.toString(16)
		.padStart(2, '0');

	return `#${normalizeHex(color, fallback)}${alphaHex}`;
}

export function getMonacoThemeName(theme: DefaultTheme) {
	return `lunar-editor-${theme.id ?? theme.scheme}`;
}

export function defineMonacoTheme(monaco: any, theme: DefaultTheme) {
	const themeName = getMonacoThemeName(theme);
	const editorBackground = theme.colors.container.alt1.background;
	const editorForeground = theme.colors.font.primary;
	const editorBorder = theme.colors.border.primary;
	const editorMuted = theme.colors.font.alt1;
	const editorWidgetBackground = theme.colors.container.alt2.background;
	const editorActiveBackground = theme.colors.container.alt4.background;

	const rules = [
		{ token: '', foreground: stripHex(editorForeground), background: stripHex(editorBackground) },
		{ token: 'string', foreground: stripHex(theme.colors.editor.primary) },
		{ token: 'string.css', foreground: stripHex(theme.colors.editor.primary) },
		{ token: 'string.html', foreground: stripHex(theme.colors.editor.primary) },
		{ token: 'string.quoted.double.json', foreground: stripHex(theme.colors.editor.primary) },
		{ token: 'number', foreground: stripHex(theme.colors.editor.alt2) },
		{ token: 'number.css', foreground: stripHex(theme.colors.editor.alt2) },
		{ token: 'keyword', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'keyword.css', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'comment', foreground: stripHex(theme.colors.editor.alt10) },
		{ token: 'comment.content', foreground: stripHex(theme.colors.editor.alt10) },
		{ token: 'delimiter', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'delimiter.css', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'delimiter.html', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'delimiter.bracket.css', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'delimiter.parenthesis.css', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'operator', foreground: stripHex(theme.colors.editor.alt8) },
		{ token: 'operator.css', foreground: stripHex(theme.colors.editor.alt8) },
		{ token: 'variable', foreground: stripHex(theme.colors.editor.alt4) },
		{ token: 'variable.css', foreground: stripHex(theme.colors.editor.alt4) },
		{ token: 'variable.parameter', foreground: stripHex(theme.colors.editor.alt4) },
		{ token: 'property', foreground: stripHex(theme.colors.editor.alt8) },
		{ token: 'tag', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'tag.css', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'tag.html', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'metatag', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'metatag.html', foreground: stripHex(theme.colors.editor.alt1) },
		{ token: 'metatag.content.html', foreground: stripHex(theme.colors.editor.alt8) },
		{ token: 'attribute.name', foreground: stripHex(theme.colors.editor.alt8) },
		{ token: 'attribute.name.css', foreground: stripHex(theme.colors.editor.alt8) },
		{ token: 'attribute.name.html', foreground: stripHex(theme.colors.editor.alt8) },
		{ token: 'attribute.value', foreground: stripHex(theme.colors.editor.primary) },
		{ token: 'attribute.value.css', foreground: stripHex(theme.colors.editor.primary) },
		{ token: 'attribute.value.html', foreground: stripHex(theme.colors.editor.primary) },
		{ token: 'attribute.value.hex.css', foreground: stripHex(theme.colors.editor.alt5) },
		{ token: 'attribute.value.number.css', foreground: stripHex(theme.colors.editor.alt2) },
		{ token: 'attribute.value.unit.css', foreground: stripHex(theme.colors.editor.alt2) },
		{ token: 'string.key.json', foreground: stripHex(theme.colors.editor.alt5) },
		{ token: 'string.value.json', foreground: stripHex(theme.colors.editor.primary) },
	];

	const colors = {
		foreground: editorForeground,
		focusBorder: theme.colors.border.alt2,
		descriptionForeground: editorMuted,
		errorForeground: theme.colors.warning.primary,
		'editor.background': editorBackground,
		'editor.foreground': editorForeground,
		'editorLineNumber.foreground': editorMuted,
		'editorLineNumber.activeForeground': editorForeground,
		'editorCursor.foreground': editorMuted,
		'editor.inactiveSelectionBackground': hexWithAlpha(theme.colors.editor.alt5, 0.18, editorBackground),
		'editor.selectionHighlightBackground': hexWithAlpha(theme.colors.editor.alt5, 0.18, editorBackground),
		'editor.lineHighlightBackground': hexWithAlpha(editorActiveBackground, 0.025, editorBackground),
		'editor.wordHighlightBackground': hexWithAlpha(theme.colors.editor.alt8, 0.18, editorBackground),
		'editor.wordHighlightStrongBackground': hexWithAlpha(theme.colors.editor.alt8, 0.26, editorBackground),
		'editor.findMatchBackground': hexWithAlpha(theme.colors.editor.alt6, 0.35, editorBackground),
		'editor.findMatchHighlightBackground': hexWithAlpha(theme.colors.editor.alt6, 0.2, editorBackground),
		'editorBracketMatch.background': hexWithAlpha(theme.colors.editor.alt5, 0.2, editorBackground),
		'editorBracketMatch.border': theme.colors.editor.alt5,
		'editorBracketHighlight.foreground1': theme.colors.editor.alt5,
		'editorBracketHighlight.foreground2': theme.colors.editor.alt8,
		'editorBracketHighlight.foreground3': theme.colors.editor.alt5,
		'editorHoverWidget.background': editorWidgetBackground,
		'editorHoverWidget.foreground': editorForeground,
		'editorHoverWidget.border': editorBorder,
		'editorHoverWidget.statusBarBackground': editorActiveBackground,
		'editorWidget.background': editorWidgetBackground,
		'editorWidget.foreground': editorForeground,
		'editorWidget.border': editorBorder,
		'editorSuggestWidget.background': editorWidgetBackground,
		'editorSuggestWidget.foreground': editorForeground,
		'editorSuggestWidget.border': editorBorder,
		'editorSuggestWidget.highlightForeground': theme.colors.editor.alt1,
		'editorSuggestWidget.focusHighlightForeground': theme.colors.editor.alt1,
		'editorSuggestWidget.selectedBackground': editorActiveBackground,
		'editorSuggestWidget.selectedForeground': editorForeground,
		'input.background': editorBackground,
		'input.foreground': editorForeground,
		'input.border': editorBorder,
		'list.activeSelectionBackground': editorActiveBackground,
		'list.activeSelectionForeground': editorForeground,
		'list.focusBackground': editorActiveBackground,
		'list.focusForeground': editorForeground,
		'list.hoverBackground': editorActiveBackground,
		'list.hoverForeground': editorForeground,
		'scrollbarSlider.background': hexWithAlpha(editorMuted, 0.25, editorBackground),
		'scrollbarSlider.hoverBackground': hexWithAlpha(editorMuted, 0.35, editorBackground),
		'scrollbarSlider.activeBackground': hexWithAlpha(editorMuted, 0.5, editorBackground),
	};

	const base = theme.scheme === 'dark' ? 'vs-dark' : 'vs';
	const signature = JSON.stringify({ base, rules, colors });

	if (definedThemeSignatures.get(themeName) !== signature) {
		monaco.editor.defineTheme(themeName, {
			base,
			inherit: false,
			rules,
			colors,
		});
		definedThemeSignatures.set(themeName, signature);
	}

	monaco.editor.setTheme(themeName);
}
