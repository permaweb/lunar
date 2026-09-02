import React from 'react';

import { readArBalance } from 'api/balances';
import { connectBrowserWallet, hasBrowserWallet, restoreBrowserWallet, setBrowserWallet } from 'api/wallet';

import { Modal } from 'components/atoms/Modal';
import { ASSETS, LINKS, STORAGE } from 'helpers/config';
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
	arBalance: number | null;
	connect: (walletType: WalletEnum) => Promise<void>;
	disconnect: () => Promise<void>;
	walletModalVisible: boolean;
	setWalletModalVisible: (open: boolean) => void;
}

const DEFAULT_CONTEXT = {
	wallets: [],
	wallet: null,
	walletAddress: null,
	walletType: null,
	arBalance: null,
	async connect() {},
	async disconnect() {},
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
			{AR_WALLETS.map((wallet: any, index: number) => (
				<S.WalletListItem key={index} onClick={() => props.onConnect(wallet.type)} className={'border-wrapper-primary'}>
					<S.WalletLogo>
						<img src={wallet.logo} alt={''} />
					</S.WalletLogo>
					<span>{wallet.label}</span>
				</S.WalletListItem>
			))}
			<S.WalletLink>
				<span>
					Don't have an Arweave Wallet? You can create one{' '}
					<a href={LINKS.wander} target={'_blank'}>
						here.
					</a>
				</span>
			</S.WalletLink>
		</S.WalletListContainer>
	);
}

export default function ArweaveProvider(props: { children: React.ReactNode }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const wallets = AR_WALLETS;

	const [wallet, setWallet] = React.useState<any>(null);
	const [walletType, setWalletType] = React.useState<WalletEnum | null>(null);
	const [walletModalVisible, setWalletModalVisible] = React.useState<boolean>(false);
	const [walletAddress, setWalletAddress] = React.useState<string | null>(null);

	const [arBalance, setArBalance] = React.useState<number | null>(null);

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
				setBrowserWallet(window, connection.wallet);
				setWalletAddress(connection.address);
				setWallet(connection.wallet);
				setWalletType(storedWalletType);
			} catch (e: any) {
				console.error(e);
			}
		}
	}

	async function handleConnect(walletType: WalletEnum) {
		let walletObj: any = null;
		switch (walletType) {
			case WalletEnum.permawebOs:
				await handleBrowserWallet(WalletEnum.permawebOs);
				break;
			case WalletEnum.wander:
				await handleBrowserWallet(WalletEnum.wander);
				break;
			default:
				if (hasBrowserWallet(window)) {
					await handleBrowserWallet(WalletEnum.wander);
					break;
				}
		}
		setWalletModalVisible(false);
		return walletObj;
	}

	async function handleBrowserWallet(walletType: WalletEnum) {
		if (walletAddress) return;
		try {
			const connection = await connectBrowserWallet(window, walletType, WALLET_PERMISSIONS);
			setBrowserWallet(window, connection.wallet);
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
	}

	async function getARBalance(walletAddress: string) {
		return Number(await readArBalance(walletAddress)) / 1e12;
	}

	return (
		<>
			{walletModalVisible && (
				<Modal header={language.connectWallet} onClose={() => setWalletModalVisible(false)}>
					<WalletList onConnect={handleConnect} />
				</Modal>
			)}
			<ARContext.Provider
				value={{
					wallet,
					walletAddress,
					walletType,
					arBalance,
					connect: handleConnect,
					disconnect: handleDisconnect,
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
