import React from 'react';
import { debounce } from 'lodash';
import { ThemeProvider } from 'styled-components';

import { STYLING } from 'helpers/config';
import {
	darkTheme,
	darkThemeAlt1,
	darkThemeAlt2,
	darkThemeHighContrast,
	lightTheme,
	lightThemeAlt1,
	lightThemeAlt2,
	lightThemeHighContrast,
	theme,
} from 'helpers/themes';
import { checkWindowCutoff } from 'helpers/window';

type ThemeType =
	| 'light-primary'
	| 'light-high-contrast'
	| 'light-alt-1'
	| 'light-alt-2'
	| 'dark-primary'
	| 'dark-high-contrast'
	| 'dark-alt-1'
	| 'dark-alt-2';

interface Settings {
	theme: ThemeType;
	syncWithSystem: boolean;
	preferredLightTheme: ThemeType;
	preferredDarkTheme: ThemeType;
	sidebarOpen: boolean;
	isDesktop: boolean;
	windowSize: { width: number; height: number };
	showCategoryAction: boolean;
	showTopicAction: boolean;
	showLinkAction: boolean;
}

interface SettingsContextState {
	settings: Settings;
	updateSettings: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

interface SettingsProviderProps {
	children: React.ReactNode;
}

const defaultSettings: Settings = {
	theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark-primary' : 'light-primary',
	syncWithSystem: true,
	preferredLightTheme: 'light-primary',
	preferredDarkTheme: 'dark-primary',
	sidebarOpen: false,
	isDesktop: true,
	windowSize: { width: window.innerWidth, height: window.innerHeight },
	showCategoryAction: false,
	showTopicAction: false,
	showLinkAction: false,
};

const SettingsContext = React.createContext<SettingsContextState>({
	settings: defaultSettings,
	updateSettings: () => {},
});

export function useSettingsProvider(): SettingsContextState {
	return React.useContext(SettingsContext);
}

export function SettingsProvider(props: SettingsProviderProps) {
	const loadStoredSettings = (): Settings => {
		const stored = localStorage.getItem('settings');
		const isDesktop = checkWindowCutoff(parseInt(STYLING.cutoffs.desktop));
		const preferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches
			? 'dark-primary'
			: 'light-primary';

		let settings: Settings;
		if (stored) {
			const parsedSettings = JSON.parse(stored);
			settings = {
				...parsedSettings,
				isDesktop,
				windowSize: { width: window.innerWidth, height: window.innerHeight },
				sidebarOpen: isDesktop ? parsedSettings.sidebarOpen : false,
				showCategoryAction: parsedSettings.showCategoryAction ?? false,
				showTopicAction: parsedSettings.showTopicAction ?? false,
				showLinkAction: parsedSettings.showLinkAction ?? false,
				syncWithSystem: parsedSettings.syncWithSystem ?? true,
				preferredLightTheme: parsedSettings.preferredLightTheme ?? 'light-primary',
				preferredDarkTheme: parsedSettings.preferredDarkTheme ?? 'dark-primary',
			};
		} else {
			settings = {
				...defaultSettings,
				theme: preferredTheme,
				isDesktop,
				sidebarOpen: isDesktop,
			};
		}

		return settings;
	};

	const [settings, setSettings] = React.useState<Settings>(loadStoredSettings());

	const handleWindowResize = React.useCallback(() => {
		const newIsDesktop = checkWindowCutoff(parseInt(STYLING.cutoffs.desktop));
		const newWindowSize = { width: window.innerWidth, height: window.innerHeight };
		setSettings((prevSettings) => {
			const newSettings = {
				...prevSettings,
				isDesktop: newIsDesktop,
				windowSize: newWindowSize,
				sidebarOpen: newIsDesktop ? prevSettings.sidebarOpen : false,
			};
			localStorage.setItem('settings', JSON.stringify(newSettings));
			return newSettings;
		});
	}, []);

	const debouncedResize = React.useCallback(debounce(handleWindowResize, 100), [handleWindowResize]);

	React.useEffect(() => {
		window.addEventListener('resize', debouncedResize);
		return () => {
			window.removeEventListener('resize', debouncedResize);
		};
	}, [debouncedResize]);

	React.useEffect(() => {
		document.body.style.overflowY = !settings.isDesktop && settings.sidebarOpen ? 'hidden' : 'auto';
		return () => {
			document.body.style.overflowY = 'auto';
		};
	}, [settings.isDesktop, settings.sidebarOpen]);

	// Listen for system theme changes when syncWithSystem is enabled
	React.useEffect(() => {
		if (!settings.syncWithSystem) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			const newTheme = e.matches ? settings.preferredDarkTheme : settings.preferredLightTheme;
			setSettings((prevSettings) => {
				const newSettings = { ...prevSettings, theme: newTheme };
				localStorage.setItem('settings', JSON.stringify(newSettings));
				return newSettings;
			});
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [settings.syncWithSystem, settings.preferredLightTheme, settings.preferredDarkTheme]);

	const updateSettings = <K extends keyof Settings>(key: K, value: Settings[K]) => {
		setSettings((prevSettings) => {
			let newSettings = { ...prevSettings, [key]: value };

			// When changing theme and syncWithSystem is enabled, update the preferred theme
			if (key === 'theme' && prevSettings.syncWithSystem) {
				const themeValue = value as ThemeType;
				const isLightTheme = themeValue.startsWith('light-');
				const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

				if (isLightTheme) {
					newSettings.preferredLightTheme = themeValue;
					// Only apply the theme if system is currently in light mode
					if (!systemIsDark) {
						newSettings.theme = themeValue;
					} else {
						// Keep the current dark theme
						newSettings.theme = prevSettings.theme;
					}
				} else {
					newSettings.preferredDarkTheme = themeValue;
					// Only apply the theme if system is currently in dark mode
					if (systemIsDark) {
						newSettings.theme = themeValue;
					} else {
						// Keep the current light theme
						newSettings.theme = prevSettings.theme;
					}
				}
			}

			// When disabling syncWithSystem, keep the current theme
			if (key === 'syncWithSystem' && value === false) {
				// Current theme stays as is
			}

			// When enabling syncWithSystem, switch to the appropriate preferred theme
			if (key === 'syncWithSystem' && value === true) {
				const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				newSettings.theme = isDark ? prevSettings.preferredDarkTheme : prevSettings.preferredLightTheme;
			}

			localStorage.setItem('settings', JSON.stringify(newSettings));
			return newSettings;
		});
	};

	function getTheme() {
		switch (settings.theme) {
			case 'light-primary':
				return theme(lightTheme);
			case 'light-high-contrast':
				return theme(lightThemeHighContrast);
			case 'light-alt-1':
				return theme(lightThemeAlt1);
			case 'light-alt-2':
				return theme(lightThemeAlt2);
			case 'dark-primary':
				return theme(darkTheme);
			case 'dark-high-contrast':
				return theme(darkThemeHighContrast);
			case 'dark-alt-1':
				return theme(darkThemeAlt1);
			case 'dark-alt-2':
				return theme(darkThemeAlt2);
			default:
				return theme(lightTheme);
		}
	}

	return (
		<SettingsContext.Provider value={{ settings, updateSettings }}>
			<ThemeProvider theme={getTheme()}>{props.children}</ThemeProvider>
		</SettingsContext.Provider>
	);
}
