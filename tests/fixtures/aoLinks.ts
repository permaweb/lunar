// Public Lunar name-token state observed on arweave.net on 2026-11-08.
export const LUNAR_LINK_PROCESS = 'Y_vgOaIPzRfT24c9rWfOeqtddmd4-E2-0Q3v2ZWLBIU';
export const LUNAR_BALANCES_LINK = 'gjU_jEYhcQugu6pemjiFizCCaCUWOKTLo2HFAKMA9l8';
export const LUNAR_LINK_HOLDER = 'uri-did-ar-uf-fqrvlqjnfmc8zzgkf4qwkunmuiqcyp0tplcgorqk5696k6whc';
export const LUNAR_LINK_HEADERS = {
	name: 'lunar',
	device: 'process@1.0',
	'execution-device': 'carrier@1.0',
	'at-slot': '30',
	balances: `ao:${LUNAR_BALANCES_LINK}`,
	'initial-holder': LUNAR_LINK_HOLDER,
};
export const LUNAR_LINK_BALANCES = { [LUNAR_LINK_HOLDER]: 1 };
