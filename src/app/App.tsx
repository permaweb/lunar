import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const views = (import.meta as any).glob('../views/**/index.tsx');

const Landing = getLazyImport('Landing');
const Explorer = getLazyImport('Explorer');
const Console = getLazyImport('Console');
const Operator = getLazyImport('Operator');
const Docs = getLazyImport('Docs');
const NotFound = getLazyImport('NotFound');

import { DOM, LINKS, URLS } from 'helpers/config';
import { Navigation } from 'navigation/Navigation';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

import * as S from './styles';

function getLazyImport(view: string) {
	const key = `../views/${view}/index.tsx`;
	const loader = views[key];
	if (!loader) {
		throw new Error(`View not found: ${view}`);
	}

	return lazy(async () => {
		const module = await loader();
		return { default: module.default };
	});
}

export default function App() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const { settings, updateSettings } = useSettingsProvider();

	if (process.env.NODE_ENV === 'development') {
		const suppressed = 'ResizeObserver loop completed with undelivered notifications.';
		const origWarn = console.warn.bind(console);
		console.warn = (msg?: any, ...args: any[]) => {
			if (typeof msg === 'string' && msg.includes(suppressed)) {
				return;
			}
			origWarn(msg, ...args);
		};
		const origError = console.error.bind(console);
		console.error = (msg?: any, ...args: any[]) => {
			if (typeof msg === 'string' && msg.includes(suppressed)) {
				return;
			}
			origError(msg, ...args);
		};
	}

	function getRoute(path: string, element: React.ReactNode) {
		const baseRoutes = [URLS.docs, `URLS.docs/*`, `${URLS.docs}:active/*`, URLS.notFound, '*'];

		if (baseRoutes.includes(path)) {
			return <Route path={path} element={element} />;
		}

		const view = (() => {
			return (
				<>
					<Navigation open={settings.sidebarOpen} toggle={() => updateSettings('sidebarOpen', !settings.sidebarOpen)} />
					<S.View navigationOpen={settings.sidebarOpen}>{element}</S.View>
					<S.ViewWrapper>
						<S.Footer navigationOpen={settings.sidebarOpen}>
							<p>
								{language.app} {new Date().getFullYear()}
							</p>
							<p>
								Built on{' '}
								<a href={LINKS.arweave} target={'_blank'}>
									Arweave
								</a>{' '}
								and{' '}
								<a href={LINKS.ao} target={'_blank'}>
									AO
								</a>
							</p>
						</S.Footer>
					</S.ViewWrapper>
				</>
			);
		})();

		return <Route path={path} element={view} />;
	}

	return (
		<>
			<div id={DOM.loader} />
			<div id={DOM.notification} />
			<div id={DOM.overlay} />
			<Suspense fallback={null}>
				<S.App>
					<Routes>
						{getRoute(URLS.base, <Landing />)}
						{getRoute(URLS.explorer, <Explorer />)}
						{getRoute(`${URLS.explorer}:txid`, <Explorer />)}
						{getRoute(`${URLS.explorer}:txid/:active`, <Explorer />)}
						{getRoute(URLS.aos, <Console />)}
						{getRoute(`${URLS.aos}:txid`, <Console />)}
						{getRoute(URLS.hb_operator, <Operator />)}
						{getRoute(URLS.docs, <Docs />)}
						{getRoute(`${URLS.docs}:active/*`, <Docs />)}
						{getRoute(URLS.notFound, <NotFound />)}
						{getRoute(`*`, <NotFound />)}
					</Routes>
				</S.App>
			</Suspense>
		</>
	);
}
