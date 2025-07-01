import { useEffect } from 'react';
import { useTheme } from 'styled-components';

export const useHeaderStyling = () => {
	const theme = useTheme();

	useEffect(() => {
		const header = document.getElementById('navigation-header');
		if (!header) return;

		// Apply initial styles
		const initialStyles = {
			background: theme.colors.container.alt1.background,
			position: 'relative',
			boxShadow: `inset 0px 6px 6px -6px ${theme.colors.shadow.primary}`,
			borderTop: `0.5px solid ${theme.colors.border.primary}`,
			borderBottom: 'none',
		};

		Object.assign(header.style, initialStyles);

		// Handle scroll behavior
		const handleScroll = () => {
			const shouldAddBorder = window.scrollY > 0;
			header.style.borderBottom = shouldAddBorder ? `1px solid ${theme.colors.border.primary}` : 'none';
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // Apply initial state

		// Cleanup function
		return () => {
			window.removeEventListener('scroll', handleScroll);
			if (header) {
				// Reset to original styles
				Object.assign(header.style, {
					background: '',
					position: 'sticky',
					boxShadow: 'none',
					borderTop: 'none',
					borderBottom: 'none',
				});
			}
		};
	}, [theme.colors.border.primary, theme.colors.container.alt1.background, theme.colors.shadow.primary]);
};
