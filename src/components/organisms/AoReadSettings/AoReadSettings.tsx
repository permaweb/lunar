import React from 'react';

import { getAoReadTransport } from 'api/aoNetwork';

import { Button } from 'components/atoms/Button';
import { Checkbox } from 'components/atoms/Checkbox';
import { FormField } from 'components/atoms/FormField';
import { type AoNetworkSettings, DEFAULT_AO_NETWORK, parseAoPeers } from 'helpers/aoNetwork';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function AoReadSettings(props: {
	settings: AoNetworkSettings;
	onChange: (settings: AoNetworkSettings) => void;
	disabled?: boolean;
}) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const transport = React.useMemo(() => getAoReadTransport(props.settings), [props.settings]);
	const status = React.useSyncExternalStore(transport.subscribe, transport.getStatus);
	const [peersInput, setPeersInput] = React.useState(props.settings.peers.join(', '));
	const peers = parseAoPeers(peersInput);
	React.useEffect(() => setPeersInput(props.settings.peers.join(', ')), [props.settings.peers]);
	function handleChange(settings: AoNetworkSettings) {
		if (!props.disabled) props.onChange(settings);
	}
	function handleSavePeers() {
		if (!peers || props.disabled) return;
		handleChange({ ...props.settings, peers });
		setPeersInput(peers.join(', '));
	}
	function handleResetPeers() {
		if (props.disabled) return;
		handleChange({ ...props.settings, peers: [...DEFAULT_AO_NETWORK.peers] });
		setPeersInput(DEFAULT_AO_NETWORK.peers.join(', '));
	}
	return (
		<S.Section>
			<S.Title>{language.aoReadNetwork}</S.Title>
			<S.Description>{language.aoReadNetworkDescription}</S.Description>
			<Checkbox
				label={language.preferPermawebOS}
				description={language.preferPermawebOSDescription}
				checked={props.settings.preferPermawebOS}
				disabled={!!props.disabled}
				onSelect={() => handleChange({ ...props.settings, preferPermawebOS: !props.settings.preferPermawebOS })}
			/>
			<Checkbox
				label={language.fallbackToPeers}
				description={language.fallbackToPeersDescription}
				checked={props.settings.fallbackToPeers}
				disabled={!!props.disabled || !props.settings.preferPermawebOS}
				onSelect={() => handleChange({ ...props.settings, fallbackToPeers: !props.settings.fallbackToPeers })}
			/>
			<S.Description role="status" aria-live="polite">
				{status.source === 'fallback'
					? language.peerFallbackActive
					: status.source === 'permawebos'
					? language.permawebOSActive
					: language.peersActive}
			</S.Description>
			{status.source === 'permawebos' && (
				<S.Providers>
					{(['processPeers', 'schedulePeers', 'linkedStatePeers'] as const).map((role) => (
						<div key={role}>
							<strong>{language[role]}</strong>
							<span>{status[role].join(', ') || language.managedByPermawebOS}</span>
						</div>
					))}
				</S.Providers>
			)}
			<FormField
				label={language.aoPeers}
				value={peersInput}
				onChange={(event) => setPeersInput(event.target.value)}
				invalid={{
					status: !props.disabled && !peers,
					message: !props.disabled && !peers ? language.invalidAoPeers : null,
				}}
				disabled={!!props.disabled}
			/>
			<S.Description>{language.aoPeersDescription}</S.Description>
			<S.PeerList>
				{props.settings.peers.map((peer) => (
					<li key={peer}>{peer}</li>
				))}
			</S.PeerList>
			<S.Actions>
				<Button
					type="alt1"
					size="small"
					label={language.savePeers}
					onPress={handleSavePeers}
					disabled={!!props.disabled || !peers || JSON.stringify(peers) === JSON.stringify(props.settings.peers)}
				/>
				<Button type="alt3" label={language.resetPeers} onPress={handleResetPeers} disabled={!!props.disabled} />
			</S.Actions>
		</S.Section>
	);
}
