function getAssetEndpoint(filename: string) {
	return `assets/${filename}`;
}

export const DEFAULT_AO_NODE = {
	url: 'https://push.forward.computer',
	authority: 'YUsEnCSlxvOMxRd1qG6rkaPwMgi3xOorfDfYJoMDndA',
	scheduler: 'n_XZJhUnmldNFo4dhajoPZWhBXuJk-OcQr5JQ49c4Zo',
};

export const DEFAULT_SCHEDULER_URL = 'https://schedule.forward.computer';
export const DEFAULT_LEGACY_SCHEDULER_URL = 'https://su-router.ao-testnet.xyz';
export const DEFAULT_LEGACY_AUTHORITY = 'fcoN_xJeisVsPXA-trzVAuIiqO3ydLQxM-L4XbrQKzY';

export const DEFAULT_GATEWAYS = {
	legacy: 'https://ao-search-gateway.goldsky.com',
	fallback: 'https://cache.forward.computer/~query@1.0/graphql',
	arweave: 'https://arweave.net/graphql',
};

export const PROCESSES = {
	ao: '0syT13r0s0tgPmIed95bJnuSqaD29HQNN8D3ElLSrsc',
	pi: '4hXj_E-5fAKmo4E8KjgQvuDJKAFk9P2grhycVmISDLs',
};

export const TOKEN_DENOMINATIONS = {
	ao: 12,
	pi: 12,
	ar: 12,
};

export const ASSETS = {
	add: getAssetEndpoint('add.svg'),
	alignBottom: getAssetEndpoint('alignBottom.svg'),
	alignLeft: getAssetEndpoint('alignLeft.svg'),
	alignRight: getAssetEndpoint('alignRight.svg'),
	alignTop: getAssetEndpoint('alignTop.svg'),
	ao: getAssetEndpoint('ao.svg'),
	app: getAssetEndpoint('app.svg'),
	arconnect: getAssetEndpoint('arconnect.webp'),
	arrow: getAssetEndpoint('arrow.svg'),
	arrowLeft: getAssetEndpoint('arrowLeft.svg'),
	arrowRight: getAssetEndpoint('arrowRight.svg'),
	arrows: getAssetEndpoint('arrows.svg'),
	article: getAssetEndpoint('article.svg'),
	arweave: getAssetEndpoint('arweave.svg'),
	block: getAssetEndpoint('block.svg'),
	bundle: getAssetEndpoint('bundle.svg'),
	checkmark: getAssetEndpoint('checkmark.svg'),
	close: getAssetEndpoint('close.svg'),
	code: getAssetEndpoint('code.svg'),
	console: getAssetEndpoint('console.svg'),
	copy: getAssetEndpoint('copy.svg'),
	dark: getAssetEndpoint('dark.svg'),
	data: getAssetEndpoint('data.svg'),
	delete: getAssetEndpoint('delete.svg'),
	design: getAssetEndpoint('design.svg'),
	disconnect: getAssetEndpoint('disconnect.svg'),
	discord: getAssetEndpoint('discord.svg'),
	docs: getAssetEndpoint('docs.svg'),
	domains: getAssetEndpoint('domains.svg'),
	drag: getAssetEndpoint('drag.svg'),
	explorer: getAssetEndpoint('explorer.svg'),
	facebook: getAssetEndpoint('facebook.svg'),
	filter: getAssetEndpoint('filter.svg'),
	fullscreen: getAssetEndpoint('fullscreen.svg'),
	go: getAssetEndpoint('go.svg'),
	header1: getAssetEndpoint('header1.svg'),
	header2: getAssetEndpoint('header2.svg'),
	header3: getAssetEndpoint('header3.svg'),
	header4: getAssetEndpoint('header4.svg'),
	header5: getAssetEndpoint('header5.svg'),
	header6: getAssetEndpoint('header6.svg'),
	help: getAssetEndpoint('help.svg'),
	image: getAssetEndpoint('image.svg'),
	info: getAssetEndpoint('info.svg'),
	keyboard: getAssetEndpoint('keyboard.svg'),
	language: getAssetEndpoint('language.svg'),
	layout: getAssetEndpoint('layout.svg'),
	light: getAssetEndpoint('light.svg'),
	link: getAssetEndpoint('link.svg'),
	linkedin: getAssetEndpoint('linkedin.svg'),
	listOrdered: getAssetEndpoint('listOrdered.svg'),
	listUnordered: getAssetEndpoint('listUnordered.svg'),
	logo: getAssetEndpoint('logo.svg'),
	menu: getAssetEndpoint('menu.svg'),
	message: getAssetEndpoint('message.svg'),
	minus: getAssetEndpoint('minus.svg'),
	navigation: getAssetEndpoint('navigation.svg'),
	newTab: getAssetEndpoint('newTab.svg'),
	paragraph: getAssetEndpoint('paragraph.svg'),
	pi: getAssetEndpoint('pi.svg'),
	plus: getAssetEndpoint('plus.svg'),
	plusMinus: getAssetEndpoint('plusMinus.svg'),
	post: getAssetEndpoint('post.svg'),
	posts: getAssetEndpoint('posts.svg'),
	process: getAssetEndpoint('process.svg'),
	othent: getAssetEndpoint('othent.svg'),
	overview: getAssetEndpoint('overview.svg'),
	quotes: getAssetEndpoint('quotes.svg'),
	read: getAssetEndpoint('read.svg'),
	refresh: getAssetEndpoint('refresh.svg'),
	save: getAssetEndpoint('save.svg'),
	search: getAssetEndpoint('search.svg'),
	send: getAssetEndpoint('send.svg'),
	settings: getAssetEndpoint('settings.svg'),
	setup: getAssetEndpoint('setup.svg'),
	shortcuts: getAssetEndpoint('shortcuts.svg'),
	success: getAssetEndpoint('success.svg'),
	telegram: getAssetEndpoint('telegram.svg'),
	time: getAssetEndpoint('time.svg'),
	tools: getAssetEndpoint('tools.svg'),
	transaction: getAssetEndpoint('transaction.svg'),
	upload: getAssetEndpoint('upload.svg'),
	url: getAssetEndpoint('url.svg'),
	user: getAssetEndpoint('user.svg'),
	users: getAssetEndpoint('users.svg'),
	video: getAssetEndpoint('video.svg'),
	wallet: getAssetEndpoint('wallet.svg'),
	wander: getAssetEndpoint('wander.svg'),
	warning: getAssetEndpoint('warning.svg'),
	write: getAssetEndpoint('write.svg'),
	x: getAssetEndpoint('x.svg'),
	youtube: getAssetEndpoint('youtube.svg'),
};

export const TAGS = {
	keys: {
		onBoot: 'On-Boot',
		type: 'Type',
		variant: 'Variant',
	},
	values: {
		eval: 'Eval',
		info: 'Info',
		balance: 'Balance',
		transfer: 'Transfer',
		debitNotice: 'Debit-Notice',
		creditNotice: 'Credit-Notice',
		process: 'Process',
	},
};

export const DEFAULT_ACTIONS = {
	eval: { name: TAGS.values.eval },
	info: { name: TAGS.values.info },
	balance: { name: TAGS.values.balance },
	transfer: { name: TAGS.values.transfer },
	debitNotice: { name: TAGS.values.debitNotice },
	creditNotice: { name: TAGS.values.creditNotice },
};

export const MINT_ACTIONS = {
	mint: { name: 'Mint' },
	piDelegationRecords: { name: 'Pi-Delegation-Records' },
	reportMint: { name: 'Report.Mint' },
	setPiIndexWeights: { name: 'Set-Pi-Index-Weights' },
	saveDelegationSummary: { name: 'Save-Delegation-Summary' },
	nextPiDelegationPage: { name: 'Next-Pi-Delegation-Page' },
};

export const DEFAULT_AO_TAGS = [{ name: 'Data-Protocol', values: ['ao'] }];
export const DEFAULT_MESSAGE_TAGS = [{ name: 'Type', values: ['Message'] }, ...DEFAULT_AO_TAGS];

export const FLAGS = {
	CLIENT_SIDE_PAGINATION: false,
	USE_TX_CACHE: true,
};

export const DOM = {
	loader: 'loader',
	notification: 'notification',
	overlay: 'overlay',
};

export const STORAGE = {
	walletType: `wallet-type`,
	profile: (id: string) => `profile-${id}`,
	customActions: 'explorer-custom-actions',
	blockFilters: 'block-filters',
	messageFilter: (id: string) => `message-filter-${id}`,
};

export const STYLING = {
	cutoffs: {
		desktop: '1200px',
		initial: '1024px',
		max: '1800px',
		tablet: '840px',
		tabletSecondary: '768px',
		secondary: '540px',
	},
	dimensions: {
		button: {
			height: '33.5px',
			width: 'fit-content',
		},
		form: {
			small: '37.5px',
			max: '45px',
		},
		nav: {
			height: '71.5px',
			width: '260px',
		},
		radius: {
			primary: '7.5px',
			alt1: '15px',
			alt2: '5px',
			alt3: '2.5px',
		},
	},
};

function createURLs() {
	const base = `/`;

	const docs = `${base}docs/`;
	const explorer = `${base}explorer/`;
	const blocks = `${base}blocks/`;
	const aos = `${base}aos/`;
	const graphql = `${base}graphql/`;

	return {
		base: base,
		blocks: blocks,
		explorer: explorer,
		explorerInfo: (id: string) => `${explorer}${id}/info`,
		explorerMessages: (id: string) => `${explorer}${id}/messages`,
		explorerRead: (id: string) => `${explorer}${id}/read`,
		explorerWrite: (id: string) => `${explorer}${id}/write`,
		explorerData: (id: string) => `${explorer}${id}/data`,
		explorerSource: (id: string) => `${explorer}${id}/source`,
		explorerAOS: (id: string) => `${explorer}${id}/aos`,
		aos: aos,
		graphql: graphql,
		docs: docs,
		docsIntro: `${docs}overview/introduction`,
		notFound: `${base}404`,
	};
}

export const URLS = createURLs();

export const LINKS = {
	arweave: `https://arweave.org`,
	ao: `https://ao.arweave.net`,
	wander: `https://wander.app`,
};
