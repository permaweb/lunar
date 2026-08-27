import React from 'react';
import { useWebWalletPresentation, WebWalletWindow } from '@permaweb/web-wallet/react';

import { hasInjectedPermawebWallet, resolveWebWalletConnectionUrl, webWalletClientProvider } from 'api/wallet';

import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

type FrameSourceState = { status: 'ready'; source: string; origin: string } | { status: 'error'; message: string };

export default function EmbeddedWallet() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const [isExtensionAvailable, setIsExtensionAvailable] = React.useState(() => hasInjectedPermawebWallet(window));
	const presentation = useWebWalletPresentation(webWalletClientProvider);
	const [transportError, setTransportError] = React.useState('');
	const frameSource = React.useMemo<FrameSourceState>(() => {
		try {
			const url = resolveWebWalletConnectionUrl(window.location);
			return { status: 'ready', source: url.href, origin: url.origin };
		} catch (error) {
			return {
				status: 'error',
				message: error instanceof Error ? error.message : language.unknownError,
			};
		}
	}, [language.unknownError]);

	const handleTransportError = React.useCallback((error: Error) => {
		setTransportError(error.message);
	}, []);

	React.useEffect(() => {
		function handleExtensionLoaded() {
			setIsExtensionAvailable(hasInjectedPermawebWallet(window));
		}

		window.addEventListener('permawebConnectLoaded', handleExtensionLoaded);
		return () => window.removeEventListener('permawebConnectLoaded', handleExtensionLoaded);
	}, []);

	if (isExtensionAvailable) return null;
	const isVisible = presentation.status !== 'hidden';
	const errorMessage = transportError || (frameSource.status === 'error' ? frameSource.message : '');

	if (frameSource.status === 'error' || transportError) {
		return (
			<S.Error $visible={isVisible} role="alert" aria-hidden={!isVisible}>
				{errorMessage}
			</S.Error>
		);
	}

	return (
		<WebWalletWindow
			provider={webWalletClientProvider}
			source={frameSource.source}
			title={language.embeddedPermawebOsWallet}
			windowTitle={language.embeddedPermawebOsWallet}
			closeLabel={language.close}
			isOpen={isVisible}
			onTransportError={handleTransportError}
		/>
	);
}
