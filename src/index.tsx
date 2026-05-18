import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import { App } from 'app';
import { GlobalStyle } from 'app/styles';
import { ArweaveProvider } from 'providers/ArweaveProvider';
import { LanguageProvider } from 'providers/LanguageProvider';
import { NotificationProvider } from 'providers/NotificationProvider';
import { PermawebProvider } from 'providers/PermawebProvider';
import { SettingsProvider } from 'providers/SettingsProvider';
import { persistor, store } from 'store';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<Provider store={store}>
		<PersistGate loading={null} persistor={persistor}>
			<HashRouter>
				<LanguageProvider>
					<NotificationProvider>
						<SettingsProvider>
							<ArweaveProvider>
								<PermawebProvider>
									<GlobalStyle />
									<App />
								</PermawebProvider>
							</ArweaveProvider>
						</SettingsProvider>
					</NotificationProvider>
				</LanguageProvider>
			</HashRouter>
		</PersistGate>
	</Provider>
);
