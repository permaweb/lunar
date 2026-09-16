import React from 'react';

import { ARWEAVE_SCHEDULE_PAGE_SIZE } from 'api/permaweb';

import { ExplorerLink } from 'components/atoms/TxAddress';
import { MessageList, type MessageListEntry } from 'components/molecules/MessageList';
import { MessageVariantEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';
import { usePermawebProvider } from 'providers/PermawebProvider';

import { useArweaveMessages } from '../../../hooks/useArweaveMessages';

import * as S from './styles';

export default function ArweaveProcessMessages(props: { processId: string; isActive: boolean }): React.ReactElement {
	const permaweb = usePermawebProvider();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const schedule = useArweaveMessages(permaweb.mainnetApi, props.processId, props.isActive);
	const page = 'data' in schedule.state ? schedule.state.data : null;
	const isLoading = schedule.state.status === 'loading' || schedule.state.status === 'refreshing';
	const edges: MessageListEntry[] = (page?.messages ?? []).map((message) => ({
		cursor: String(message.slot),
		node: {
			id: message.id,
			slot: message.slot,
			owner: { address: message.sender },
			recipient: message.recipient ?? undefined,
			tags: message.tags,
			data: { size: '0', type: '' },
			block: { height: message.blockHeight },
		},
		display: {
			typeLabel: message.slot === 0 ? language.process : `${language.message} (${MessageVariantEnum.Mainnet})`,
			actionLabel: message.slot === 0 ? language.processCreation : message.action || language.none,
			time: <ExplorerLink value={message.blockHeight} type={'block'} />,
			input: '',
			details: [
				{ name: language.slot, value: message.slot.toString() },
				{ name: language.blockHeightActual, value: message.blockHeight.toString() },
				{ name: language.blockIndex, value: message.blockIndex.toString() },
			],
		},
	}));
	return (
		<S.Wrapper>
			<MessageList
				txId={props.processId}
				type={'process'}
				variant={MessageVariantEnum.Mainnet}
				currentFilter={'incoming'}
				header={language.messages}
				headerCount={schedule.totalCount}
				showFilteredMessages
				source={{
					edges,
					loading: isLoading,
					page: schedule.page,
					pageSize: ARWEAVE_SCHEDULE_PAGE_SIZE,
					totalCount: schedule.totalCount,
					canReadResults: false,
					timeLabel: language.blockHeightActual,
					loadingMessage: language.arweaveMessagesLoading,
					emptyMessage: language.arweaveMessagesEmpty,
					error:
						'error' in schedule.state
							? schedule.state.status === 'stale'
								? language.arweaveMessagesStale
								: language.arweaveMessagesError
							: undefined,
					onPageChange: schedule.onPageChange,
					onRefresh: schedule.refresh,
					onRetry: schedule.retry,
				}}
			/>
		</S.Wrapper>
	);
}
