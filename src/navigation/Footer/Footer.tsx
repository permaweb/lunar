import React from 'react';
import { ReactSVG } from 'react-svg';

import { DeploymentRecord, getDeployedTransaction, peekDeployedTransaction } from 'api/deployment';

import { ExplorerLink } from 'components/atoms/TxAddress';
import { ASSETS, LINKS } from 'helpers/config';
import { debugLog } from 'helpers/utils';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

type DeploymentState = { status: 'loading' } | { status: 'success'; record: DeploymentRecord } | { status: 'error' };

export default function Footer() {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];

	const [deployment, setDeployment] = React.useState<DeploymentState>(() => {
		const resolved = peekDeployedTransaction();
		return resolved ? { status: 'success', record: resolved } : { status: 'loading' };
	});

	React.useEffect(() => {
		const controller = new AbortController();

		(async function () {
			try {
				const record = await getDeployedTransaction({ signal: controller.signal });
				if (!controller.signal.aborted) setDeployment({ status: 'success', record });
			} catch (error) {
				if (controller.signal.aborted) return;
				debugLog('warn', 'Footer', 'Unable to read the deployed transaction:', error);
				setDeployment({ status: 'error' });
			}
		})();

		return () => controller.abort();
	}, []);

	return (
		<S.Wrapper>
			<S.Section>
				<S.Info>
					<S.Icon className={'app-icon'}>
						<ReactSVG src={ASSETS.logo} wrapper={'span'} />
					</S.Icon>
					{language.app} {new Date().getFullYear()}
				</S.Info>
				<S.Links>
					&nbsp;- Network explorer for &nbsp;
					<a href={LINKS.arweave} target={'_blank'} rel={'noopener noreferrer'}>
						Arweave
					</a>
					&nbsp; and &nbsp;
					<a href={LINKS.ao} target={'_blank'} rel={'noopener noreferrer'}>
						AO
					</a>{' '}
				</S.Links>
			</S.Section>
			<S.Section>
				<S.Deployment>
					<span>{`${language.appDeployment}:`}</span>
					{deployment.status === 'success' ? (
						<ExplorerLink value={deployment.record.transactionId} type={'transaction'} tooltipPosition={'top-right'} />
					) : (
						<S.DeploymentFallback>-</S.DeploymentFallback>
					)}
				</S.Deployment>
			</S.Section>
		</S.Wrapper>
	);
}
