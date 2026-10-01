import { Modal } from 'components/atoms/Modal';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function AoCoreCoverageInfo(props: { onClose: () => void }) {
	const provider = useLanguageProvider();
	const language = provider.object[provider.current].aoCore.coverageInfo;

	return (
		<Modal type="panel" width={515} header={language.title} onClose={props.onClose}>
			<S.PanelContent>
				<S.PanelSection>
					<h3>{language.introductionTitle}</h3>
					<p>{language.introduction}</p>
					<p>{language.commitmentsDescription}</p>
				</S.PanelSection>
				<S.PanelSection>
					<h3>{language.labelsTitle}</h3>
					<S.Facts>
						{language.labels.map((entry) => (
							<div key={entry.label}>
								<dt>{entry.label}</dt>
								<dd>{entry.description}</dd>
							</div>
						))}
					</S.Facts>
				</S.PanelSection>
				<S.PanelSection>
					<h3>{language.exampleTitle}</h3>
					<p>{language.exampleIntroduction}</p>
					<S.Facts>
						{language.exampleCommitments.map((entry) => (
							<div key={entry.label}>
								<dt>{entry.label}</dt>
								<dd>
									<S.Code>{entry.fields}</S.Code>
								</dd>
							</div>
						))}
					</S.Facts>
					<p>{language.exampleConclusion}</p>
				</S.PanelSection>
				{language.sections.map((section) => (
					<S.PanelSection key={section.id}>
						<h3>{section.title}</h3>
						{section.paragraphs.map((paragraph) => (
							<p key={paragraph}>{paragraph}</p>
						))}
					</S.PanelSection>
				))}
			</S.PanelContent>
		</Modal>
	);
}
