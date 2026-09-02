import React from 'react';

import { Button } from 'components/atoms/Button';
import { ASSETS } from 'helpers/config';
import { CSS_DIMENSIONS } from 'helpers/themes';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

const PREVIEW_MESSAGE_SOURCE = 'lunar-html-preview';
const APP_LOADER_GRACE_PERIOD_MS = 3000;
const APP_LOADER_MAX_WAIT_MS = 10000;

type PreviewMessage = {
	source: typeof PREVIEW_MESSAGE_SOURCE;
	channel: string;
	reason: 'preview-ready' | 'script-load' | 'script-runtime' | 'startup-stalled';
	resource?: string;
};

function getInstrumentedHtml(html: string, baseUrl: string | undefined, channel: string) {
	if (typeof DOMParser === 'undefined') return html;

	const document = new DOMParser().parseFromString(html, 'text/html');

	if (baseUrl && !document.head.querySelector('base')) {
		const base = document.createElement('base');
		base.href = baseUrl;
		document.head.prepend(base);
	}

	const monitor = document.createElement('script');
	monitor.textContent = `
		(function () {
			var loaded = false;
			var failed = false;
			var report = function (reason, resource) {
				if (reason === 'preview-ready' && failed) return;
				if (reason !== 'preview-ready') failed = true;

				window.parent.postMessage({
					source: ${JSON.stringify(PREVIEW_MESSAGE_SOURCE)},
					channel: ${JSON.stringify(channel)},
					reason: reason,
					resource: resource || undefined
				}, '*');
			};
			var reportStalledLoader = function () {
				var loader = document.getElementById('app-loader');
				var root = document.getElementById('root');
				if (!loader) return false;

				var loaderStyle = window.getComputedStyle(loader);
				var loaderVisible = loaderStyle.display !== 'none' && loaderStyle.visibility !== 'hidden';
				var rootEmpty = !root || (root.childElementCount === 0 && !root.textContent.trim());

				if (loaderVisible && rootEmpty) {
					report('startup-stalled', '#app-loader');
					return true;
				}

				return false;
			};

			window.setTimeout(reportStalledLoader, ${APP_LOADER_MAX_WAIT_MS});

			window.addEventListener('load', function () {
				loaded = true;

				if (!document.getElementById('app-loader')) {
					report('preview-ready');
					return;
				}

				window.setTimeout(function () {
					if (!reportStalledLoader()) report('preview-ready');
				}, ${APP_LOADER_GRACE_PERIOD_MS});
			});

			window.addEventListener('error', function (event) {
				var target = event.target;
				if (target && target.tagName === 'SCRIPT') {
					report('script-load', target.src || target.getAttribute('src'));
				} else if (!loaded && target === window) {
					report('script-runtime', event.filename);
				}
			}, true);
		})();
	`;
	document.head.prepend(monitor);

	return `<!DOCTYPE html>${document.documentElement.outerHTML}`;
}

export default function HTMLViewer(props: {
	html?: string;
	src?: string;
	baseUrl?: string;
	header?: string | null;
	fixedHeight?: number;
	className?: string;
	title?: string;
	onPreviewReady?: () => void;
	onPreviewError?: (message: PreviewMessage) => void;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const containerRef = React.useRef<HTMLDivElement>(null);
	const frameRef = React.useRef<HTMLIFrameElement>(null);
	const channelRef = React.useRef(`html-preview-${Math.random().toString(36).slice(2)}`);
	const [fullScreenMode, setFullScreenMode] = React.useState(false);
	const instrumentedHtml = React.useMemo(
		() => (props.html ? getInstrumentedHtml(props.html, props.baseUrl, channelRef.current) : undefined),
		[props.html, props.baseUrl]
	);

	React.useLayoutEffect(() => {
		if ((!props.onPreviewReady && !props.onPreviewError) || !instrumentedHtml) return;

		const handleMessage = (event: MessageEvent<PreviewMessage>) => {
			if (event.source !== frameRef.current?.contentWindow) return;
			if (event.data?.source !== PREVIEW_MESSAGE_SOURCE || event.data.channel !== channelRef.current) return;

			if (event.data.reason === 'preview-ready') props.onPreviewReady?.();
			else props.onPreviewError?.(event.data);
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [instrumentedHtml, props.onPreviewError, props.onPreviewReady]);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(document.fullscreenElement === containerRef.current);
		};

		document.addEventListener('fullscreenchange', onFullScreenChange);
		return () => document.removeEventListener('fullscreenchange', onFullScreenChange);
	}, []);

	const toggleFullscreen = React.useCallback(async () => {
		const element = containerRef.current;
		if (!element) return;

		if (document.fullscreenElement !== element) {
			if (document.fullscreenElement) await document.exitFullscreen?.();
			await element.requestFullscreen?.();
		} else {
			await document.exitFullscreen?.();
		}
	}, []);

	return (
		<S.Container
			ref={containerRef}
			$fixedHeight={!fullScreenMode ? props.fixedHeight : undefined}
			$fullScreenMode={fullScreenMode}
			className={props.className}
		>
			<S.Header>
				<p>{props.header ?? 'HTML'}</p>
				<Button
					type={'alt1'}
					icon={ASSETS.fullscreen}
					onPress={toggleFullscreen}
					height={25}
					width={25}
					noMinWidth
					iconSize={12.5}
					padding={`${CSS_DIMENSIONS.px3_95} 0 0 0`}
					tooltip={fullScreenMode ? language.exitFullScreen : language.enterFullScreen}
					tooltipPosition={'bottom-right'}
					stopPropagation
					preventDefault
				/>
			</S.Header>
			<S.Frame
				ref={frameRef}
				src={props.src}
				srcDoc={props.src ? undefined : instrumentedHtml}
				title={props.title ?? props.header ?? 'HTML preview'}
				sandbox={'allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts'}
				referrerPolicy={'no-referrer'}
			/>
		</S.Container>
	);
}
