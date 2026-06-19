import React from 'react';

import { Button } from 'components/atoms/Button';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { parseCSV } from './parse';
import * as S from './styles';

const INITIAL_ROW_LIMIT = 250;
const ROW_LIMIT_INCREMENT = 250;
const COPY_RESET_MS = 2000;

export default function CSVViewer(props: {
	csv: string;
	header?: string | null;
	fixedHeight?: number;
	className?: string;
	filename?: string;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const containerRef = React.useRef<HTMLDivElement>(null);
	const copyResetTimeout = React.useRef<number | null>(null);
	const [copied, setCopied] = React.useState(false);
	const [fullScreenMode, setFullScreenMode] = React.useState(false);
	const [visibleRowCount, setVisibleRowCount] = React.useState(INITIAL_ROW_LIMIT);

	const rows = React.useMemo(() => parseCSV(props.csv), [props.csv]);
	const headers = rows[0] ?? [];
	const bodyRows = rows.slice(1);
	const visibleRows = bodyRows.slice(0, visibleRowCount);
	const remainingRows = Math.max(bodyRows.length - visibleRows.length, 0);
	const columnCount = rows.reduce((count, currentRow) => Math.max(count, currentRow.length), 0);

	React.useEffect(() => {
		setVisibleRowCount(INITIAL_ROW_LIMIT);
	}, [props.csv]);

	React.useEffect(() => {
		const onFullScreenChange = () => {
			setFullScreenMode(document.fullscreenElement === containerRef.current);
		};

		document.addEventListener('fullscreenchange', onFullScreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
			if (copyResetTimeout.current) window.clearTimeout(copyResetTimeout.current);
		};
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

	const copyCSV = React.useCallback(async () => {
		if (!props.csv) return;

		await navigator.clipboard.writeText(props.csv);
		setCopied(true);

		if (copyResetTimeout.current) window.clearTimeout(copyResetTimeout.current);
		copyResetTimeout.current = window.setTimeout(() => setCopied(false), COPY_RESET_MS);
	}, [props.csv]);

	const downloadCSV = React.useCallback(() => {
		if (!props.csv) return;

		const blob = new Blob([props.csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');

		link.href = url;
		link.download = props.filename?.endsWith('.csv') ? props.filename : `${props.filename ?? 'data'}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}, [props.csv, props.filename]);

	return (
		<S.Container
			ref={containerRef}
			$fixedHeight={!fullScreenMode ? props.fixedHeight : undefined}
			$fullScreenMode={fullScreenMode}
			className={props.className}
		>
			<S.Header>
				<p>{props.header ?? 'CSV'}</p>
				<S.ActionsWrapper>
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
					<Button
						type={'alt1'}
						icon={ASSETS.save}
						handlePress={downloadCSV}
						disabled={!props.csv}
						height={25}
						width={25}
						noMinWidth
						iconSize={12.5}
						padding={'3.5px 0 0 0'}
						tooltip={'Download CSV'}
						tooltipPosition={'bottom-right'}
						stopPropagation
						preventDefault
					/>
					<Button
						type={'alt1'}
						icon={ASSETS.copy}
						handlePress={copyCSV}
						disabled={!props.csv}
						height={25}
						width={25}
						noMinWidth
						iconSize={12.5}
						tooltip={copied ? `${language.copied}!` : 'Copy CSV'}
						tooltipPosition={'bottom-right'}
						stopPropagation
						preventDefault
					/>
				</S.ActionsWrapper>
			</S.Header>

			<S.TableWrapper className={'scroll-wrapper'}>
				{rows.length > 0 && columnCount > 0 ? (
					<>
						<S.Table>
							<thead>
								<tr>
									{Array.from({ length: columnCount }, (_, columnIndex) => (
										<th key={columnIndex}>{headers[columnIndex] || `Column ${columnIndex + 1}`}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{visibleRows.map((currentRow, rowIndex) => (
									<tr key={rowIndex}>
										{Array.from({ length: columnCount }, (_, columnIndex) => (
											<td key={columnIndex}>{currentRow[columnIndex] ?? ''}</td>
										))}
									</tr>
								))}
							</tbody>
						</S.Table>
						{remainingRows > 0 && (
							<S.LoadMoreWrapper>
								<Button
									type={'alt4'}
									label={`Load ${Math.min(ROW_LIMIT_INCREMENT, remainingRows)} more rows (${remainingRows} remaining)`}
									handlePress={() => setVisibleRowCount((current) => current + ROW_LIMIT_INCREMENT)}
								/>
							</S.LoadMoreWrapper>
						)}
					</>
				) : (
					<S.Placeholder>{language.noDataToDisplay}</S.Placeholder>
				)}
			</S.TableWrapper>
		</S.Container>
	);
}
