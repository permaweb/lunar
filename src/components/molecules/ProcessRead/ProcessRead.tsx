import React from 'react';

import { Button } from 'components/atoms/Button';
import { Loader } from 'components/atoms/Loader';
import { JSONReader } from 'components/molecules/JSONReader';
import { AO_NODE } from 'helpers/config';
import { MessageVariantEnum } from 'helpers/types';
import { checkValidAddress, formatMs, removeCommitments } from 'helpers/utils';
import { usePermawebProvider } from 'providers/PermawebProvider';

import * as S from './styles';

export default function ProcessRead(props: {
	processId: string;
	variant: MessageVariantEnum;
	autoRun: boolean;
	hideOutput?: boolean;
}) {
	const permawebProvider = usePermawebProvider();

	const [cuLocation, setCuLocation] = React.useState(null);
	const [startTime, setStartTime] = React.useState(null);
	const [roundtripTime, setRoundtripTime] = React.useState(null);
	const [elapsed, setElapsed] = React.useState(0);
	const [isFetching, setIsFetching] = React.useState(false);
	const [toggleRead, setToggleRead] = React.useState(false);
	const [currentOutput, setCurrentOutput] = React.useState<any>(null);
	const [readLog, setReadLog] = React.useState([]);
	const [errorLog, setErrorLog] = React.useState([]);

	const isInitialMount = React.useRef(true);

	React.useEffect(() => {
		(async function () {
			setCuLocation(null);
			setCurrentOutput(null);
			setReadLog([]);
			setErrorLog([]);
			switch (props.variant) {
				case MessageVariantEnum.Legacynet:
					try {
						const response = await fetch(`https://cu.ao-testnet.xyz/results/${props.processId}`, {
							method: 'GET',
						});

						const cu = new URL(response.url);
						setCuLocation(cu.host);
					} catch (e: any) {
						console.error(e);
					}
					break;
				case MessageVariantEnum.Mainnet:
					setCuLocation(AO_NODE.url);
					break;
			}
		})();
	}, [props.processId, props.variant]);

	const safelyParseNestedJSON = (input) => {
		if (typeof input === 'string') {
			try {
				const parsed = JSON.parse(input);
				return safelyParseNestedJSON(parsed);
			} catch (e) {
				return input;
			}
		} else if (Array.isArray(input)) {
			return input.map(safelyParseNestedJSON);
		} else if (input !== null && typeof input === 'object') {
			return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, safelyParseNestedJSON(value)]));
		}
		return input;
	};

	const fetchData = async () => {
		if (props.processId && checkValidAddress(props.processId)) {
			let frameId: any;
			try {
				setIsFetching(true);
				const start = Date.now();
				setStartTime(start);

				const tick = () => {
					setElapsed(Date.now() - start);
					frameId = requestAnimationFrame(tick);
				};

				tick();

				let response;
				switch (props.variant) {
					case MessageVariantEnum.Legacynet:
						response = await permawebProvider.libs.readProcess({
							processId: props.processId,
							action: 'Info',
						});
						break;
					case MessageVariantEnum.Mainnet:
						response = await permawebProvider.libsMainnet.readState({ processId: props.processId });
						break;
				}

				let parsedResponse;
				try {
					parsedResponse = typeof response === 'string' ? JSON.parse(response) : response;
					parsedResponse = safelyParseNestedJSON(parsedResponse);
				} catch (e) {
					// If JSON parsing fails, treat it as a plain string response
					parsedResponse = response;
				}
				setCurrentOutput(removeCommitments(parsedResponse));

				const roundTrip = Date.now() - start;
				setRoundtripTime(roundTrip);
				cancelAnimationFrame(frameId);
				setIsFetching(false);

				setReadLog((prevLog) => [...prevLog, { startTime: start, roundtripTime: roundTrip }]);
			} catch (e) {
				console.error(e);
				cancelAnimationFrame(frameId);
				setIsFetching(false);
				setErrorLog((prevLog) => [...prevLog, { time: Date.now(), message: e.message || 'Unknown error' }]);
			}
		}
	};

	React.useEffect(() => {
		if (props.autoRun) fetchData();
	}, [props.processId, props.variant, props.autoRun]);

	React.useEffect(() => {
		if (isInitialMount.current) {
			isInitialMount.current = false;
			return;
		}
		if (!isFetching) {
			fetchData();
		}
	}, [props.processId, toggleRead]);

	return (
		<S.Wrapper>
			<S.SectionWrapper className={'border-wrapper-alt3'}>
				<S.Header>
					<S.HeaderMain>
						<p>{`${cuLocation ?? '-'}`}</p>
					</S.HeaderMain>
					<Button
						type={'alt3'}
						label={isFetching ? 'Running...' : 'Run'}
						disabled={isFetching}
						handlePress={() => setToggleRead((prev) => !prev)}
					/>
				</S.Header>
				<S.Body>
					<S.Section>
						<S.SectionHeader>
							<p>Current Run</p>
						</S.SectionHeader>
						<S.SectionBody>
							<S.Line>
								<span>{startTime ? `Start Time: ${new Date(startTime).toLocaleTimeString()}` : 'Starting...'}</span>
							</S.Line>
							<S.Line>
								<span>
									{isFetching
										? `Elapsed: ${formatMs(elapsed)}`
										: `Roundtrip Time: ${roundtripTime ? formatMs(roundtripTime) : '-'}`}
								</span>
							</S.Line>
						</S.SectionBody>
					</S.Section>
					{readLog.length > 0 && (
						<S.Section>
							<S.SectionHeader>
								<p>Read Log</p>
							</S.SectionHeader>
							<S.SectionBody>
								{readLog.length === 0 ? (
									<S.Line>
										<span>No reads yet</span>
									</S.Line>
								) : (
									readLog.map((log, index) => (
										<S.Line key={index}>
											<span>
												{`(${index + 1}) Started at ${new Date(
													log.startTime
												).toLocaleTimeString()}, Roundtrip Time (${formatMs(log.roundtripTime)})`}
											</span>
										</S.Line>
									))
								)}
							</S.SectionBody>
						</S.Section>
					)}
					{errorLog.length > 0 && (
						<S.Section>
							<S.SectionHeader>
								<p>Error Log</p>
							</S.SectionHeader>
							<S.SectionBody>
								{errorLog.length === 0 ? (
									<S.Line>
										<span>No errors</span>
									</S.Line>
								) : (
									errorLog.map((err, index) => (
										<S.Error key={index}>
											<span>{`Error ${index + 1} at ${new Date(err.time).toLocaleTimeString()}: ${err.message}`}</span>
										</S.Error>
									))
								)}
							</S.SectionBody>
						</S.Section>
					)}
				</S.Body>
				{isFetching && (
					<S.LoadingWrapper>
						<Loader xSm relative />
					</S.LoadingWrapper>
				)}
			</S.SectionWrapper>
			{!props.hideOutput && currentOutput && (
				<S.OutputWrapper>
					<JSONReader data={currentOutput} header={'Info'} maxHeight={600} />
				</S.OutputWrapper>
			)}
		</S.Wrapper>
	);
}
