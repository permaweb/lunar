import React from 'react';

import { Button } from 'components/atoms/Button';
import { formatCount, stripUrlProtocol } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { useSettingsProvider } from 'providers/SettingsProvider';

import * as S from './styles';

export default function NodeConnection() {
	const languageProvider = useLanguageProvider();
	const language = React.useMemo(() => languageProvider.object[languageProvider.current], [languageProvider.current]);
	const settingsProvider = useSettingsProvider();

	const uptimeRef = React.useRef<HTMLParagraphElement>(null);

	const [executions, setExecutions] = React.useState<string>('-');
	const [systemLoad, setSystemLoad] = React.useState<string>('-');
	const [reads, setReads] = React.useState<string>('-');
	const [writes, setWrites] = React.useState<string>('-');

	const [_metrics, setMetrics] = React.useState<any>(null);
	const [isOnline, setIsOnline] = React.useState<boolean>(false);
	const [isLoading, setIsLoading] = React.useState<boolean>(true);

	React.useEffect(() => {
		let seed = 0;
		let startTime = Date.now();
		let rafId: number;

		// Reset all fields when node changes
		setExecutions('-');
		setSystemLoad('-');
		setReads('-');
		setWrites('-');
		setMetrics(null);
		setIsOnline(false);
		setIsLoading(true);
		if (uptimeRef.current) {
			uptimeRef.current.textContent = '–';
		}

		const activeNode = settingsProvider.settings.nodes.find((node) => node.active).url;

		async function init() {
			try {
				const response = await fetch(`${activeNode}/~hyperbuddy@1.0/metrics`);

				if (!response.ok) {
					setIsOnline(false);
					setIsLoading(false);
					return;
				}

				const data = await response.text();
				const groups = parseMetrics(data);
				setMetrics(groups);
				setIsOnline(true);
				setIsLoading(false);

				const u = groups.gauge?.find((m) => m.name === 'process_uptime_seconds')?.values[0].data;
				if (u == null) return;

				seed = u;
				if (uptimeRef.current) {
					uptimeRef.current.textContent = formatCount(seed.toString());
				}
				startTime = Date.now();

				// @ts-ignore
				function animate() {
					const elapsed = (Date.now() - startTime) / 1000;
					const current = seed + elapsed;
					if (uptimeRef.current) {
						uptimeRef.current.textContent = formatCount(current.toFixed(2));
					}
					rafId = requestAnimationFrame(animate);
				}
				animate();
			} catch (error) {
				console.error('Failed to fetch node metrics:', error);
				setIsOnline(false);
				setIsLoading(false);
			}
		}

		init();
		return () => cancelAnimationFrame(rafId);
	}, [settingsProvider.settings.nodes]);

	function parseMetrics(text: string) {
		const lines = text.split('\n');
		const groups: any = {};
		let currentMetric = null;

		lines.forEach((line) => {
			line = line.trim();
			if (!line) return;

			if (line.startsWith('# TYPE')) {
				const parts = line.split(/\s+/);
				const metricName = parts[2];
				const metricType = parts[3];

				if (!groups[metricType]) {
					groups[metricType] = [];
				}

				currentMetric = {
					name: metricName,
					help: '',
					values: [],
				};

				groups[metricType].push(currentMetric);
			} else if (line.startsWith('# HELP')) {
				const parts = line.split(/\s+/);
				const metricName = parts[2];
				const helpText = parts.slice(3).join(' ');
				if (currentMetric && currentMetric.name === metricName) {
					currentMetric.help = helpText;
				}
			} else if (line.startsWith('#')) {
				// Skip other comments
			} else {
				if (currentMetric) {
					const match = line.match(/(-?\d+(\.\d+)?)(\s*)$/);
					if (match) {
						let label = currentMetric.name;
						const data = parseFloat(match[1]);

						const inputMatch = line.match(/\{([^}]*)\}/);
						if (inputMatch) {
							label = inputMatch[1];
						}
						if (label === `system_load`) {
							setSystemLoad(formatCount(data.toString()));
						} else if (currentMetric.name === 'event' && label.includes('topic="ao_result",event="ao_result"')) {
							setExecutions(formatCount(data.toString()));
						}

						currentMetric.values.push({ label, data });
					}
				}
			}
		});

		if (groups.counter) {
			const spawnedProcesse = groups.counter.find((item) => item.name === 'cowboy_spawned_processes_total');

			if (spawnedProcesse?.values) {
				const readsHandled =
					spawnedProcesse.values.find((value) =>
						value.label.includes('method="GET",reason="normal",status_class="success"')
					)?.data || 0;

				const writesHandled =
					spawnedProcesse.values.find((value) =>
						value.label.includes('method="POST",reason="normal",status_class="success"')
					)?.data || 0;

				setReads(formatCount(readsHandled.toString()));
				setWrites(formatCount(writesHandled.toString()));
			}
		}

		return groups;
	}

	return (
		<S.Wrapper className={'border-wrapper-alt4'}>
			<S.ActionWrapper>
				<Button
					type={'alt4'}
					label={language.changeConnection}
					handlePress={() => settingsProvider.setShowNodeSettings(true)}
				/>
			</S.ActionWrapper>
			<S.MetricsSection>
				<p>{language.currentConnection}</p>
				<p ref={uptimeRef} className={'metric-value'}>
					{stripUrlProtocol(settingsProvider.settings.nodes.find((node) => node.active).url)}
				</p>
				<S.MetricLineFlex>
					<span>
						{language.status}: {isLoading ? `${language.loading}...` : isOnline ? language.online : language.offline}
					</span>
					{!isLoading && <S.Indicator isOnline={isOnline} />}
				</S.MetricLineFlex>
			</S.MetricsSection>
			<S.MetricsSection>
				<p>{language.uptime}</p>
				<p ref={uptimeRef} className={'metric-value'}>
					–
				</p>
				<span>{language.seconds}</span>
			</S.MetricsSection>
			<S.MetricsSection>
				<p>{language.aoCoreExecutions}</p>
				<p className={'metric-value'}>{executions}</p>
				<span>{language.executions}</span>
			</S.MetricsSection>
			<S.MetricsSection>
				<p>{language.systemLoad}</p>
				<p className={'metric-value'}>{systemLoad}</p>
				<span>{language.cpuAverage}</span>
			</S.MetricsSection>
			<S.MetricsSection>
				<p>{language.readRequestsHandled}</p>
				<p className={'metric-value'}>{reads}</p>
				<span>{language.requests}</span>
			</S.MetricsSection>
			<S.MetricsSection>
				<p>{language.writeRequestsHandled}</p>
				<p className={'metric-value'}>{writes}</p>
				<span>{language.requests}</span>
			</S.MetricsSection>
		</S.Wrapper>
	);
}
