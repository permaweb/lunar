import React from 'react';
import { useLocation } from 'react-router-dom';

import { MessageList } from 'components/molecules/MessageList';
import type { ProcessMessagesViewProps } from 'components/organisms/Transaction';
import { URLS } from 'helpers/config';
import { getAoVariantFromTags, getTagValue } from 'helpers/utils';

import { ArweaveProcessMessages } from '../ArweaveProcessMessages';

import * as S from './styles';

export default function ProcessMessages(props: ProcessMessagesViewProps): React.ReactElement | null {
	const location = useLocation();
	// A restored process tab can render before its metadata arrives. Do not start the legacy reader speculatively.
	if (!props.transaction) return null;
	const tags = props.transaction?.node?.tags;
	const isArweaveScheduler = getTagValue(tags, 'scheduler-device')?.toLowerCase() === 'arweave-scheduler@1.0';
	return (
		<S.Wrapper>
			{isArweaveScheduler ? (
				<ArweaveProcessMessages
					processId={props.processId}
					isActive={props.isActive && location.pathname.replace(/\/+$/, '') === URLS.explorerMessages(props.processId)}
				/>
			) : (
				<MessageList
					txId={props.processId}
					variant={getAoVariantFromTags(tags)}
					type={'process'}
					recipient={props.transaction?.node?.recipient ?? getTagValue(tags, 'Target')}
					parentId={props.processId}
					authority={getTagValue(tags, 'Authority')}
					onMessageOpen={props.onMessageOpen}
				/>
			)}
		</S.Wrapper>
	);
}
