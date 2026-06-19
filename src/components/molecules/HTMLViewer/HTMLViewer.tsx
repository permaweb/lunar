import React from 'react';

import { Button } from 'components/atoms/Button';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function HTMLViewer(props: {
	html?: string;
	src?: string;
	header?: string | null;
	fixedHeight?: number;
	className?: string;
	title?: string;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const containerRef = React.useRef<HTMLDivElement>(null);
	const [fullScreenMode, setFullScreenMode] = React.useState(false);

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
					handlePress={toggleFullscreen}
					height={25}
					width={25}
					noMinWidth
					iconSize={12.5}
					padding={'3.95px 0 0 0'}
					tooltip={fullScreenMode ? language.exitFullScreen : language.enterFullScreen}
					tooltipPosition={'bottom-right'}
					stopPropagation
					preventDefault
				/>
			</S.Header>
			<S.Frame
				src={props.src}
				srcDoc={props.src ? undefined : props.html}
				title={props.title ?? props.header ?? 'HTML preview'}
				sandbox={'allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-scripts'}
				referrerPolicy={'no-referrer'}
			/>
		</S.Container>
	);
}
