import 'styled-components';

declare module 'styled-components' {
	export interface DefaultTheme {
		id?: string;
		scheme: 'dark' | 'light';
		colors: any;
		typography: any;
	}
}
