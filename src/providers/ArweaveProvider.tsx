import React from 'react';

import {
	type BrowserWallet,
	connectBrowserWallet,
	isArweaveAddress,
	isEmbeddedBrowserWallet,
	openEmbeddedWebWallet,
	restoreBrowserWallet,
} from 'api/wallet';

import { Button } from 'components/atoms/Button';
import { Modal } from 'components/atoms/Modal';
import { ASSETS, LINKS, STORAGE } from 'helpers/config';
import { getARBalanceEndpoint } from 'helpers/endpoints';
import { WalletEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

const WALLET_PERMISSIONS = ['ACCESS_ADDRESS', 'ACCESS_PUBLIC_KEY', 'SIGN_TRANSACTION', 'DISPATCH', 'SIGNATURE'];

const AR_WALLETS = [
	{ type: WalletEnum.permawebOs, label: 'PermawebOS', logo: ASSETS.permawebOs },
	{ type: WalletEnum.wander, label: 'Wander', logo: ASSETS.wander },
];

interface ArweaveContextState {
	wallets: { type: WalletEnum; logo: string }[];
	wallet: any;
	walletAddress: string | null;
	walletType: WalletEnum | null;
	isEmbeddedWallet: boolean;
	arBalance: number | null;
	handleConnect: (walletType: WalletEnum) => Promise<void>;
	handleDisconnect: () => void;
	handleOpenWallet: () => void;
	walletModalVisible: boolean;
	setWalletModalVisible: (open: boolean) => void;
}

const DEFAULT_CONTEXT: ArweaveContextState = {
	wallets: [],
	wallet: null,
	walletAddress: null,
	walletType: null,
	isEmbeddedWallet: false,
	arBalance: null,
	async handleConnect() {},
	handleDisconnect() {},
	handleOpenWallet() {},
	walletModalVisible: false,
	setWalletModalVisible(_open: boolean) {},
};

const ARContext = React.createContext<ArweaveContextState>(DEFAULT_CONTEXT);

export function useArweaveProvider(): ArweaveContextState {
	return React.useContext(ARContext);
}

function WalletList(props: { onConnect: (walletType: WalletEnum) => Promise<void> }) {
	return (
		<S.WalletListContainer>
			{AR_WALLETS.map((wallet) => (
				<S.WalletListItem key={wallet.type}>
					<Button
						type={'primary'}
						fullWidth
						height={100}
						label={
							<S.WalletChoice>
								<span>{wallet.label}</span>
							</S.WalletChoice>
						}
						handlePress={() => void props.onConnect(wallet.type)}
					/>
				</S.WalletListItem>
			))}
			<S.WalletLink>
				<span>
					Don't have an Arweave Wallet? You can create one{' '}
					<a href={LINKS.wander} target={'_blank'} rel="noopener noreferrer">
						here.
					</a>
				</span>
			</S.WalletLink>
		</S.WalletListContainer>
	);
}

export function ArweaveProvider(props: { children: React.ReactNode }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const wallets = AR_WALLETS;

	const [wallet, setWallet] = React.useState<any>(null);
	const [walletType, setWalletType] = React.useState<WalletEnum | null>(null);
	const [walletModalVisible, setWalletModalVisible] = React.useState<boolean>(false);
	const [walletAddress, setWalletAddress] = React.useState<string | null>(null);

	const [arBalance, setArBalance] = React.useState<number | null>(null);
	const isEmbeddedWallet = isEmbeddedBrowserWallet(wallet as BrowserWallet | null);

	React.useEffect(() => {
		handleWallet();

		window.addEventListener('arweaveWalletLoaded', handleWallet);
		window.addEventListener('permawebConnectLoaded', handleWallet);
		window.addEventListener('walletSwitch', handleWallet);

		return () => {
			window.removeEventListener('arweaveWalletLoaded', handleWallet);
			window.removeEventListener('permawebConnectLoaded', handleWallet);
			window.removeEventListener('walletSwitch', handleWallet);
		};
	}, []);

	React.useEffect(() => {
		const activeWallet = wallet as BrowserWallet | null;
		if (!activeWallet?.events) return;

		function handleActiveAddress(address: unknown) {
			if (isArweaveAddress(address)) setWalletAddress(address);
		}

		function handleWalletDisconnect() {
			setWallet(null);
			setWalletAddress(null);
			setWalletType(null);
		}

		activeWallet.events.on('activeAddress', handleActiveAddress);
		activeWallet.events.on('disconnect', handleWalletDisconnect);
		return () => {
			activeWallet.events?.off('activeAddress', handleActiveAddress);
			activeWallet.events?.off('disconnect', handleWalletDisconnect);
		};
	}, [wallet]);

	React.useEffect(() => {
		(async function () {
			if (walletAddress) {
				try {
					setArBalance(await getARBalance(walletAddress));
				} catch (e: any) {
					console.error(e);
				}
			}
		})();
	}, [walletAddress]);

	async function handleWallet() {
		const storedWalletType = localStorage.getItem(STORAGE.walletType) as WalletEnum | null;
		if (storedWalletType) {
			try {
				const connection = await restoreBrowserWallet(window, storedWalletType, WALLET_PERMISSIONS);
				if (!connection) return;
				window.arweaveWallet = connection.wallet as Window['arweaveWallet'];
				setWalletAddress(connection.address);
				setWallet(connection.wallet);
				setWalletType(storedWalletType);
			} catch (e: any) {
				console.error(e);
			}
		}
	}

	async function handleConnect(walletType: WalletEnum): Promise<void> {
		switch (walletType) {
			case WalletEnum.permawebOs:
				await handleBrowserWallet(WalletEnum.permawebOs);
				break;
			case WalletEnum.wander:
				await handleBrowserWallet(WalletEnum.wander);
				break;
			default:
				if (window.arweaveWallet) {
					await handleBrowserWallet(WalletEnum.wander);
					break;
				}
		}
	}

	async function handleBrowserWallet(walletType: WalletEnum) {
		if (walletAddress) return;
		try {
			const connection = await connectBrowserWallet(window, walletType, WALLET_PERMISSIONS);
			window.arweaveWallet = connection.wallet as Window['arweaveWallet'];
			setWalletAddress(connection.address);
			setWallet(connection.wallet);
			setWalletType(walletType);
			setWalletModalVisible(false);
			localStorage.setItem(STORAGE.walletType, walletType);
		} catch (e: any) {
			console.error(e);
		}
	}

	async function handleDisconnect() {
		if (localStorage.getItem(STORAGE.walletType)) localStorage.removeItem(STORAGE.walletType);
		await wallet?.disconnect?.();
		setWallet(null);
		setWalletAddress(null);
		setWalletType(null);
	}

	function handleOpenWallet() {
		if (isEmbeddedWallet) openEmbeddedWebWallet();
	}

	async function getARBalance(walletAddress: string) {
		const rawBalance = await fetch(getARBalanceEndpoint(walletAddress));
		const jsonBalance = await rawBalance.json();
		return jsonBalance / 1e12;
	}

	return (
		<>
			{walletModalVisible && (
				<Modal header={language.connectWallet} handleClose={() => setWalletModalVisible(false)}>
					<WalletList onConnect={handleConnect} />
				</Modal>
			)}
			<ARContext.Provider
				value={{
					wallet,
					walletAddress,
					walletType,
					isEmbeddedWallet,
					arBalance,
					handleConnect,
					handleDisconnect,
					handleOpenWallet,
					wallets,
					walletModalVisible,
					setWalletModalVisible,
				}}
			>
				{props.children}
			</ARContext.Provider>
		</>
	);
}
