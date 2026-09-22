import { TxAddress } from 'components/atoms/TxAddress';
import { SummaryPanel } from 'components/molecules/SummaryPanel';
import type { AoProcessScheduler, AoProcessSummary } from 'helpers/processes';
import { MessageVariantEnum } from 'helpers/types';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function AoProcess(props: { process: AoProcessSummary }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	function getVariantLabel(variant: MessageVariantEnum | null) {
		switch (variant) {
			case MessageVariantEnum.Mainnet:
				return `${language.mainnet} (${variant})`;
			case MessageVariantEnum.Legacynet:
				return `${language.legacynet} (${variant})`;
			default:
				return '-';
		}
	}

	function getSchedulerLabel(scheduler: AoProcessScheduler | null) {
		if (!scheduler) return '-';

		return scheduler.type === 'device' ? scheduler.device : language.legacynet;
	}

	return (
		<SummaryPanel
			title={language.aoProcess}
			subject={{ label: language.name, value: <S.Name>{props.process.name ?? '-'}</S.Name> }}
			rows={[
				{
					id: 'process',
					items: [
						{ id: 'variant', label: language.variant, value: <p>{getVariantLabel(props.process.variant)}</p> },
						{
							id: 'owner',
							label: language.owner,
							value: props.process.owner ? <TxAddress address={props.process.owner} /> : <p>-</p>,
						},
						{
							id: 'scheduler',
							label: language.schedulerType,
							value: <p>{getSchedulerLabel(props.process.scheduler)}</p>,
						},
					],
				},
			]}
		/>
	);
}
