import React from 'react';

import { type AoCoreReadResult, messageJson, messageText } from 'api/aoCore';

import { Button } from 'components/atoms/Button';
import { Modal } from 'components/atoms/Modal';
import { Editor } from 'components/molecules/Editor';
import { ASSETS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function AoCoreMessageInfo(props: { result: AoCoreReadResult }) {
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current].aoCore;
	const [showInfo, setShowInfo] = React.useState(false);
	const [rawVisible, setRawVisible] = React.useState(false);
	const handleOpenInfo = () => setShowInfo(true);
	const handleCloseInfo = React.useCallback(() => setShowInfo(false), []);
	const handleToggleRaw = () => setRawVisible((value) => !value);
	const result = props.result;
	const data = result.data;

	return (
		<>
			<Button
				type="primary"
				icon={ASSETS.info}
				tooltip={language.aboutMessage}
				aria-label={language.aboutMessage}
				aria-haspopup="dialog"
				aria-expanded={showInfo}
				height={32.5}
				width={32.5}
				iconSize={14.5}
				noMinWidth
				onPress={handleOpenInfo}
				active={showInfo}
				stopPropagation
				preventDefault
			/>
			{showInfo && (
				<Modal type="panel" width={515} header={language.aboutMessage} onClose={handleCloseInfo}>
					<S.PanelContent>
						<S.PanelSection>
							<S.Actions>
								<S.Badge>{language.storedMessage}</S.Badge>
								<S.Badge>{language.unverified}</S.Badge>
							</S.Actions>
							<h3>{language.introduction}</h3>
							<S.Muted>{language.introductionDescription}</S.Muted>
							<S.Facts>
								<div>
									<dt>{language.requestedId}</dt>
									<dd>
										<S.Code>{data.requestedId}</S.Code>
									</dd>
								</div>
								<div>
									<dt>{language.device}</dt>
									<dd>
										<S.Code>
											{data.device ?? (data.deviceSource === 'default' ? 'message@1.0' : language.inlineDevice)}
										</S.Code>
										{data.deviceSource === 'default' && <S.Muted>{language.defaultDevice}</S.Muted>}
										{data.deviceSource === 'linked' && <S.Muted>{language.linkedDevice}</S.Muted>}
									</dd>
								</div>
								<div>
									<dt>{language.role}</dt>
									<dd>{messageText(data.message, 'type') ?? language.unknownRole}</dd>
								</div>
								<div>
									<dt>{language.representation}</dt>
									<dd>{language.jsonRepresentation}</dd>
								</div>
							</S.Facts>
							<S.Muted>
								{language.recognizedBy} {data.evidence.map((item) => language.evidence[item]).join(', ')}.{' '}
								{language.recognitionExplanation}
							</S.Muted>
						</S.PanelSection>
						<S.PanelSection>
							<h3>{language.resolutionTitle}</h3>
							<S.Steps>
								<li>
									<h4>{language.baseTitle}</h4>
									<p>{language.baseDescription}</p>
								</li>
								<li>
									<h4>{language.requestTitle}</h4>
									<p>{language.requestDescription}</p>
								</li>
								<li>
									<h4>{language.resultTitle}</h4>
									<p>{language.resultDescription}</p>
								</li>
							</S.Steps>
							<S.Muted>{language.resolutionExplanation}</S.Muted>
						</S.PanelSection>
						<S.PanelSection>
							<h3>{language.provenance}</h3>
							<S.Facts>
								<div>
									<dt>{language.provider}</dt>
									<dd>{result.provider || language.configuredPeers}</dd>
								</div>
								<div>
									<dt>{language.source}</dt>
									<dd>{language.sources[result.source]}</dd>
								</div>
							</S.Facts>
							<S.Muted>{language.identityExplanation}</S.Muted>
							<Button
								type="alt3"
								label={rawVisible ? language.hideRaw : language.showRaw}
								onPress={handleToggleRaw}
								aria-expanded={rawVisible}
							/>
							{rawVisible && (
								<>
									<Editor initialData={data.rawText} language="json" readOnly loading={false} fixedHeight={350} />
									<Editor
										initialData={messageJson(data.headers)}
										language="json"
										readOnly
										loading={false}
										fixedHeight={350}
									/>
								</>
							)}
						</S.PanelSection>
					</S.PanelContent>
				</Modal>
			)}
		</>
	);
}
