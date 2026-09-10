import React from 'react';
import { Chart } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { Chart as ChartJS, Tooltip } from 'chart.js';
import { ChoroplethController, ColorScale, GeoFeature, ProjectionScale, topojson } from 'chartjs-chart-geo';
import iso from 'i18n-iso-countries';
import { useTheme } from 'styled-components';
import type { GeometryCollection, Topology } from 'topojson-specification';
import worldAtlas from 'world-atlas/countries-110m.json';

import type { ArweavePeer, NodeCountries, NodeCountry } from 'api/nodes';
import { nodesApi } from 'api/nodes';

import { Button } from 'components/atoms/Button';
import { getTranslucentColor } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { getCountryColors } from '../../../model/mapColors';

import * as S from './styles';

ChartJS.register(ChoroplethController, ColorScale, GeoFeature, ProjectionScale, Tooltip);
const topology = worldAtlas as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
const outline = topojson.feature(topology, topology.objects.countries).features;
const countryIndexes = new Map(outline.map((feature, index) => [String(feature.id), index]));
const countryIds = outline.map((feature) => String(feature.id));
const countryNeighbors = topojson.neighbors(topology.objects.countries.geometries);
type CountryState = { status: 'loading' | 'error' } | ({ status: 'success' } & NodeCountries);
const NO_COUNTRIES: NodeCountry[] = [];

export default function NodesMap(props: { peers: ArweavePeer[] }) {
	const theme = useTheme();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const [state, setState] = React.useState<CountryState>({ status: 'loading' });
	const [attempt, setAttempt] = React.useState(0);
	React.useEffect(() => {
		const controller = new AbortController();
		setState({ status: 'loading' });
		nodesApi.getCountries(props.peers, controller.signal).then(
			(result) => {
				if (!controller.signal.aborted) setState({ status: 'success', ...result });
			},
			() => {
				if (!controller.signal.aborted) setState({ status: 'error' });
			}
		);
		return () => controller.abort();
	}, [props.peers, attempt]);
	const countries = state.status === 'success' ? state.countries : NO_COUNTRIES;
	const uniqueIPs = React.useMemo(() => new Set(props.peers.map((peer) => peer.ip)).size, [props.peers]);
	const points = React.useMemo(() => {
		const locations = new Map(countries.map(({ ip, countryCode }) => [ip, countryCode]));
		const counts = new Map<string, number>();
		for (const peer of props.peers) {
			const countryCode = locations.get(peer.ip);
			if (countryCode) counts.set(countryCode, (counts.get(countryCode) ?? 0) + 1);
		}
		const names = new Intl.DisplayNames([languageProvider.current], { type: 'region' });
		return [...counts]
			.map(([countryCode, value]) => ({
				countryCode,
				value,
				label: names.of(countryCode) ?? countryCode,
			}))
			.sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, languageProvider.current));
	}, [props.peers, countries, languageProvider.current]);
	const countryCounts = React.useMemo(() => {
		const counts = new Map<string, number>();
		for (const point of points) {
			const id = iso.alpha2ToNumeric(point.countryCode);
			if (id) counts.set(id, (counts.get(id) ?? 0) + point.value);
		}
		return counts;
	}, [points]);
	const countryColors = React.useMemo(
		() => getCountryColors(countryIds, countryNeighbors, Object.values<string>(theme.colors.editor)),
		[theme.colors.editor]
	);
	const colorAt = (index: number) => countryColors[index] ?? theme.colors.font.alt1;
	const neutralFill = getTranslucentColor(theme.colors.container.alt4.background, 0.5);
	const hasNodes = (index: number) => countryCounts.has(String(outline[index]?.id));
	const chartData: ChartData<'choropleth'> = {
		labels: outline.map((feature) => String(feature.properties?.name ?? '')),
		datasets: [
			{
				label: language.arweaveNodes,
				outline,
				showOutline: true,
				showGraticule: false,
				data: outline.map((feature) => ({ feature, value: countryCounts.get(String(feature.id)) ?? 0 })),
				backgroundColor: (context) =>
					hasNodes(context.dataIndex) ? getTranslucentColor(colorAt(context.dataIndex), 0.55) : neutralFill,
				borderColor: (context) => (hasNodes(context.dataIndex) ? colorAt(context.dataIndex) : theme.colors.border.alt2),
				borderWidth: 0.75,
				hoverBackgroundColor: (context) => (hasNodes(context.dataIndex) ? colorAt(context.dataIndex) : neutralFill),
				hoverBorderColor: (context) =>
					hasNodes(context.dataIndex) ? colorAt(context.dataIndex) : theme.colors.border.alt2,
				hoverBorderWidth: 1,
				outlineBackgroundColor: neutralFill,
				outlineBorderColor: theme.colors.border.alt2,
			},
		],
	};
	const options: ChartOptions<'choropleth'> = {
		responsive: true,
		maintainAspectRatio: false,
		animation: false,
		layout: { padding: 0 },
		interaction: { mode: 'nearest', intersect: true },
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: theme.colors.container.primary.background,
				titleColor: theme.colors.font.primary,
				bodyColor: theme.colors.font.primary,
				borderColor: theme.colors.border.alt2,
				borderWidth: 1,
				displayColors: false,
				callbacks: {
					label: (context) =>
						`${(countryCounts.get(String(outline[context.dataIndex]?.id)) ?? 0).toLocaleString()} ${language.nodes}`,
				},
			},
		},
		scales: {
			projection: { axis: 'x', projection: 'equalEarth' },
			color: { axis: 'x', display: false },
		},
	};
	return (
		<S.Wrapper>
			<S.Progress role={'status'}>
				{state.status === 'loading' ? language.nodesMapLoading : language.nodesMapProgress(countries.length, uniqueIPs)}
				{state.status === 'success' &&
					countries.length < uniqueIPs &&
					` · ${language.nodesMapFailures(uniqueIPs - countries.length)}`}
			</S.Progress>
			<S.CanvasWrapper>
				<Chart
					type={'choropleth'}
					data={chartData}
					options={options}
					role={'img'}
					aria-label={language.nodesMapLabel}
				/>
			</S.CanvasWrapper>
			{state.status === 'success' && !countries.length && <S.Note>{language.nodesMapEmpty}</S.Note>}
			{state.status === 'error' && (
				<>
					<S.Note role={'alert'}>{language.nodesMapLoadError}</S.Note>
					<Button type={'alt3'} label={language.nodesMapRetry} onPress={() => setAttempt((current) => current + 1)} />
				</>
			)}
			<S.LocationList aria-label={language.nodesMapLabel}>
				{points.map((point) => (
					<li key={point.countryCode}>
						<S.LocationName>
							<S.Swatch
								$color={colorAt(countryIndexes.get(iso.alpha2ToNumeric(point.countryCode)) ?? 0)}
								aria-hidden={'true'}
							/>
							<S.LocationLabel title={point.label}>{point.label}</S.LocationLabel>
						</S.LocationName>
						<S.LocationCount>{point.value.toLocaleString()}</S.LocationCount>
					</li>
				))}
			</S.LocationList>
		</S.Wrapper>
	);
}
