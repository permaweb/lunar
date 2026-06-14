import React, { lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { Route, Routes } from 'react-router-dom';

import { serviceWorkerManager } from 'helpers/serviceWorkerManager';
import { pruneTransactionCache } from 'store/transactions/reducer';
const views = (import.meta as any).glob('../views/**/index.tsx');

const Landing = getLazyImport('Landing');
const Blocks = getLazyImport('Blocks');
const Explorer = getLazyImport('Explorer');
const Console = getLazyImport('Console');
const GraphQL = getLazyImport('GraphQL');
const Docs = getLazyImport('Docs');
const NotFound = getLazyImport('NotFound');

import { Loader } from 'components/atoms/Loader';
import { DOM, LINKS, URLS } from 'helpers/config';
import { stripUrlProtocol } from 'helpers/utils';
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

const APP_VERSION = '0.0.2';

export default function App() {
	const dispatch = useDispatch();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const { settings, updateSettings, setShowNodeSettings } = useSettingsProvider();

	const hasHiddenLoaderRef = React.useRef(false);
	const hasInitializedServiceWorkerRef = React.useRef(false);

	const activeNode = React.useMemo(
		() => settings.nodes.find((node) => node.active) ?? settings.nodes[0],
		[settings.nodes]
	);

	const [isNodeOnline, setIsNodeOnline] = React.useState<boolean>(false);
	const [isNodeStatusLoading, setIsNodeStatusLoading] = React.useState<boolean>(true);

	React.useEffect(() => {
		const storedVersion = localStorage.getItem('app-version');
		if (storedVersion !== APP_VERSION) {
			console.log(`Version change detected (${storedVersion} -> ${APP_VERSION}). Clearing IndexedDB...`);
			indexedDB.deleteDatabase('lunar-db');
			localStorage.setItem('app-version', APP_VERSION);
		}
	}, []);

	React.useEffect(() => {
		dispatch(pruneTransactionCache());
	}, [dispatch]);

	React.useEffect(() => {
		if (!hasInitializedServiceWorkerRef.current) {
			hasInitializedServiceWorkerRef.current = true;
			(async () => {
				await serviceWorkerManager.register();
				await serviceWorkerManager.checkArNSUpdate();
			})();
		}
	}, []);

	React.useEffect(() => {
		if (!hasHiddenLoaderRef.current && settings) {
			hasHiddenLoaderRef.current = true;
			document.body.style.background = '';
			const loader = document.getElementById('app-loader');
			if (loader) {
				loader.style.display = 'none';
			}
		}
	}, [settings]);

	React.useEffect(() => {
		let cancelled = false;
		const controller = new AbortController();
		let timeout: number | undefined;

		async function checkNodeStatus() {
			if (!settings.showNodeStatus || !activeNode?.url) {
				setIsNodeOnline(false);
				setIsNodeStatusLoading(false);
				return;
			}

			setIsNodeOnline(false);
			setIsNodeStatusLoading(true);
			timeout = window.setTimeout(() => controller.abort(), 10000);

			try {
				const nodeUrl = activeNode.url.replace(/\/$/, '');
				const response = await fetch(`${nodeUrl}/~hyperbuddy@1.0/metrics`, { signal: controller.signal });

				if (!cancelled) {
					setIsNodeOnline(response.ok);
				}
			} catch (error) {
				const isAbortError = error instanceof Error && error.name === 'AbortError';
				if (!cancelled && !isAbortError) {
					console.error('Failed to fetch node status:', error);
				}
				if (!cancelled) {
					setIsNodeOnline(false);
				}
			} finally {
				if (timeout) {
					window.clearTimeout(timeout);
				}
				if (!cancelled) {
					setIsNodeStatusLoading(false);
				}
			}
		}

		checkNodeStatus();

		return () => {
			cancelled = true;
			controller.abort();
			if (timeout) {
				window.clearTimeout(timeout);
			}
		};
	}, [activeNode?.url, settings.showNodeStatus]);

	// @ts-ignore
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
		const baseRoutes = [URLS.notFound, '*'];

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
								<a href={LINKS.ao} target={'_blank'}>
									AO
								</a>{' '}
								Explorer built on{' '}
								<a href={LINKS.arweave} target={'_blank'}>
									Arweave
								</a>{' '}
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
			<Suspense fallback={<Loader />}>
				<S.App>
					<Routes>
						{getRoute(URLS.base, <Landing />)}
						{getRoute(URLS.blocks, <Blocks />)}
						{getRoute(URLS.explorer, <Explorer />)}
						{getRoute(`${URLS.explorer}:txid`, <Explorer />)}
						{getRoute(`${URLS.explorer}:txid/:active`, <Explorer />)}
						{getRoute(URLS.aos, <Console />)}
						{getRoute(`${URLS.aos}:txid`, <Console />)}
						{getRoute(URLS.graphql, <GraphQL />)}
						{getRoute(URLS.docs, <Docs />)}
						{getRoute(`${URLS.docs}:active/*`, <Docs />)}
						{getRoute(URLS.notFound, <NotFound />)}
						{getRoute(`*`, <NotFound />)}
					</Routes>
					{settings.showNodeStatus && activeNode && (
						<S.NodeStatusButton
							type={'button'}
							onClick={() => setShowNodeSettings(true)}
							aria-label={`${language.aoMainnet} ${language.node}: ${stripUrlProtocol(activeNode.url)}. ${
								isNodeStatusLoading ? `${language.loading}...` : isNodeOnline ? language.online : language.offline
							}`}
							title={language.changeConnection}
						>
							<S.NodeStatusIndicator $isOnline={isNodeOnline} $isLoading={isNodeStatusLoading} />
							<S.NodeStatusText>
								<p>{stripUrlProtocol(activeNode.url)}</p>
							</S.NodeStatusText>
						</S.NodeStatusButton>
					)}
				</S.App>
			</Suspense>
		</>
	);
}
