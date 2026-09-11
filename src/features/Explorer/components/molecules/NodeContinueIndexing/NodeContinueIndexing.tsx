import React from 'react';

import { Button } from 'components/atoms/Button';
import { useLanguageProvider } from 'providers/LanguageProvider';

import { NODE_HISTORY_BATCH } from '../../../model/node';

export default function NodeContinueIndexing(props: { disabled: boolean; onPress: () => void }): React.ReactElement {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current];
	return (
		<Button
			type={'alt3'}
			label={language.nodeContinueIndexing}
			tooltip={language.nodeIndexOlder(NODE_HISTORY_BATCH)}
			disabled={props.disabled}
			onPress={props.onPress}
		/>
	);
}
