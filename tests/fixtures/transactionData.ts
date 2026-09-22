export const EMPTY_TRANSFER_ID = 'B96Uvs5eF3muB-KYuubbeA5KrROSPjqKgbYgn_4CeME';
export const EMPTY_TRANSFER_OWNER = 'wCSXTL1g1Entfpv5iyPNHxJlk9N6MfhYve2reKFJWTg';
export const TOKEN_PROCESS_ID = 'suz9pH8HYQbmzhhU-UaudmHf2_9l4qiyStyrYWxNcMc';
export const MESSAGE_ID = 'xoD4IhFzmFTsAaqJ3-S7_k6-SkfVJLNUBTBsfTunL-k';
export const BUNDLE_ID = 'YOtNvBJNUYutcKFiICzbRNq_N7IHs0vFyiL4uTOfjpA';

/** The HyperBEAM node web UI a gateway serves as the body of a message that carries no data. */
export const HYPERBUDDY_HTML = [
	'<!DOCTYPE html>',
	'<html lang="en">',
	'\t<head>',
	'\t\t<title>Hyperbuddy</title>',
	'\t</head>',
	'\t<body>',
	'\t\t<div id="root"></div>',
	'\t</body>',
	'</html>',
].join('\n');

/** Headers arweave.net returns for the 0-byte L1 transfer: its signed fields, with no committed body. */
export const EMPTY_TRANSFER_HEADERS: Record<string, string> = {
	'content-type': 'text/html',
	action: 'transfer',
	anchor: 'w6wUJQvXTWiUxg-_Z7SrATYAOVDV1gZcNDdK5uRiTVAKySCI6GQyIRfTjA6co07q',
	'ao-types': 'status="integer"',
	quantity: '1000000000000',
	recipient: 'n6QjVXFWUMHUIgNL6E7tEAHGGbKc2jFwW4bU-LYNbDU',
	reward: '39682136',
	'signature-input':
		'comm-b96uvs5ef3mub-kyuubbea5krrospjqkgbygn_4ceme=("action" "anchor" "quantity" "recipient" "reward" "signing-client" "signing-client-version" "target");alg="tx@1.0/rsa-pss-sha256";keyid="publickey:g70XHiNnq7zUk85ys6W33qT_mHom4Q25rsdp_y2Y8GmJc2fvoQ49w4mg2ahnlSUbyk0s1trvyLBsxg2rou-CSKTfgMhk2MwrROPT04Rr0-Np0b2cEqwgBxyvqMIKbxUrl6R_g1gmKe8nJYBl3TZeoTTNZUg6of7Z9jqAIRvWfPkFL10OVbwxbwRDjssZueMUBY52mpCAZzODpgr2ylkFvaOI0cLgnDPoeybn4KHtwp3cK5oEe8PGACMGHcGKi-zQuzlYRtTv75TZNg1S6Dwg3oev-fiFICSik5VaSbPqDuN4u-8Q6xtsib0YWfHfrXcLNfIRpOlTC4yePD8YZ-GTGp407DW-iK_tZlcn8hAx7K2QqyMOty2q4yo2d2GlCghsTSAHC58FgEKsJ_4Mtap8GrZIClna1ur7QCJn67P-1c_goMgUjNi5S7F382eP25kVa3pYkWLngra4YhLMnOy3YRT_iFZ5oRTwi_aN1jWljhLNfkOpPW5WlE65xKrSihdlVNRJCQY39mMvGYZphdhU4hO9htUwciMANPD8Wgcns-MlvZj646SSr5C2JLVQd_6P4u-y77sSS8Cq0n4B4XTJXfsGNxAV-tJr_45gBx899dSqm_PTx8HDQKGXFBzLqaMmMn_cwfYe0vVhGRhm_uKjfCHF2F_TH-R-uX8UBlG76tM";bundle="false";field-anchor="w6wUJQvXTWiUxg-_Z7SrATYAOVDV1gZcNDdK5uRiTVAKySCI6GQyIRfTjA6co07q";field-reward="39682136";field-target="suz9pH8HYQbmzhhU-UaudmHf2_9l4qiyStyrYWxNcMc";original-tags="1:action:dHJhbnNmZXI, 2:recipient:bjZRalZYRldVTUhVSWdOTDZFN3RFQUhHR2JLYzJqRndXNGJVLUxZTmJEVQ, 3:quantity:MTAwMDAwMDAwMDAwMA, 4:signing-client:UGVybWF3ZWJPUy1Ccm93c2Vy, 5:signing-client-version:MC4xLjA"',
	'signing-client': 'PermawebOS-Browser',
	'signing-client-version': '0.1.0',
	status: '200',
	target: TOKEN_PROCESS_ID,
};

/** Headers of a data item whose body is committed through its signed content-digest. */
export function committedMessageHeaders(headers: Record<string, string> = {}): Record<string, string> {
	return {
		action: 'Move',
		'ao-body-key': 'data',
		'content-digest': 'sha-256=:TepcfLcPUDIuydc0qkqgeL6SJ8BSUeGJkcWW84dVI3A=:',
		'data-protocol': 'ao',
		'signature-input': `comm-${MESSAGE_ID.toLowerCase()}=("action" "ao-body-key" "content-digest" "data-protocol" "target");alg="ans104@1.0/rsa-pss-sha256";keyid="publickey:${'k'.repeat(
			683
		)}";bundle="false";field-target="${TOKEN_PROCESS_ID}"`,
		target: TOKEN_PROCESS_ID,
		...headers,
	};
}

/** Headers of an L1 bundle, which the node unpacks into links and answers with its web UI. */
export const BUNDLE_HEADERS: Record<string, string> = {
	'content-type': 'text/html',
	'1+link': 'hqzZYRhss7wgxZ8s7cAIEg7FTlTRZwxQXg7jKn_9bAQ',
	anchor: 'w6wUJQvXTWiUxg-_Z7SrATYAOVDV1gZcNDdK5uRiTVAKySCI6GQyIRfTjA6co07q',
	reward: '3280315789',
	'signature-input': `comm-${BUNDLE_ID.toLowerCase()}=("1+link" "anchor" "reward");alg="tx@1.0/rsa-pss-sha256";keyid="publickey:${'k'.repeat(
		683
	)}";bundle="true";bundle-format="binary";bundle-version="2.0.0";field-anchor="w6wUJQvXTWiUxg-_Z7SrATYAOVDV1gZcNDdK5uRiTVAKySCI6GQyIRfTjA6co07q";field-reward="3280315789"`,
};
