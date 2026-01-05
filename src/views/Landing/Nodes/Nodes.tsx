import React from 'react';

import { getRoutesEndpoint } from 'helpers/endpoints';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

function Node(props: { index: number; node: any }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [healthy, setHealthy] = React.useState<boolean | null>(null);

	React.useEffect(() => {
		(async function () {
			if (props.node) {
				try {
					const result = await fetch(`${props.node.prefix}/~meta@1.0/info/address`);
					setHealthy(result.status === 200);
				} catch (e: any) {
					setHealthy(false);
				}
			}
		})();
	}, [props.node]);

	function getHealthStatus() {
		if (healthy === null) {
			return <span>{`${language.checking}...`}</span>;
		}

		return (
			<>
				<span>{healthy ? language.healthy : language.unhealthy}</span>
				<S.Indicator healthy={healthy} />
			</>
		);
	}

	return props.node ? (
		<S.NodeWrapper href={props.node.prefix} target={'_blank'} key={props.node.reference}>
			<S.NodeHeader>
				<p>
					<span>{`(${props.index}) `}</span>
					{props.node.prefix}
				</p>
				<S.IndicatorWrapper>{getHealthStatus()}</S.IndicatorWrapper>
			</S.NodeHeader>
			{/* <S.NodeBody>
				<S.NodeLine>
					<span>Price:</span>
					<p>{formatCount(props.node.price?.toString() ?? '0')}</p>
					<span>ARM</span>
				</S.NodeLine>
				<S.NodeLine>
					<span>Performance:</span>
					<p>{formatCount(props.node.performance?.toString() ?? '0')}</p>
				</S.NodeLine>
			</S.NodeBody> */}
		</S.NodeWrapper>
	) : null;
}

export default function Nodes() {
	const [routerUrls] = React.useState<string[]>(['push.forward.computer']);
	const [routers, setRouters] = React.useState<any[] | null>(null);

	React.useEffect(() => {
		(async () => {
			if (routerUrls.length === 0 || routers) return;

			try {
				for (const routerUrl of routerUrls) {
					const res = await fetch(getRoutesEndpoint(routerUrl));
					const parsed = (await res.json())['3'];
					const groups = makeScoreGroups(parsed.nodes);

					setRouters((prev) => [...(prev ?? []), { name: routerUrl, groups }]);
				}
			} catch (e) {
				console.error(e);
			}
		})();
	}, [routerUrls, routers]);

	function makeScoreGroups<T>(arr: T[]): T[][] {
		const groups: T[][] = [];
		const rem = arr.length % 2;
		let i = 0;

		if (rem !== 0) {
			groups.push(arr.slice(0, rem));
			i = rem;
		}

		while (i < arr.length) {
			groups.push(arr.slice(i, i + 2));
			i += 2;
		}

		return groups;
	}

	return (
		<S.Wrapper>
			{routers ? (
				routers.map((router, index) => {
					return (
						<S.RouterWrapper key={index}>
							<S.RouterBody>
								{router.groups.map((rowNodes, rowIndex) => (
									<S.NodeRow count={rowNodes.length} key={rowIndex}>
										{rowNodes.map((node: any, index: number) => {
											const nodeIndex = rowIndex * 2 + index + 1;
											return <Node key={nodeIndex} index={nodeIndex} node={node} />;
										})}
									</S.NodeRow>
								))}
							</S.RouterBody>
							{/* <S.RouterFooter>
								<S.Subheader>
									<span>{router.name}</span>
								</S.Subheader>
							</S.RouterFooter> */}
						</S.RouterWrapper>
					);
				})
			) : (
				<S.RouterWrapper>
					<S.Placeholder />
					<S.Placeholder />
					<S.Placeholder />
				</S.RouterWrapper>
			)}
		</S.Wrapper>
	);
}
