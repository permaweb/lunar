import { useLocation, useNavigate } from 'react-router-dom';

import { Toggle } from 'components/atoms/Toggle';
import { ViewTitle } from 'components/molecules/ViewTitle';
import { NodeForks, NodesTable } from 'features/Nodes';
import { URLS } from 'helpers/config';
import { useLanguageProvider } from 'providers/LanguageProvider';

import * as S from './styles';

export default function Nodes() {
	const location = useLocation();
	const navigate = useNavigate();
	const languageProvider = useLanguageProvider();
	const language = languageProvider.object[languageProvider.current];
	const view = location.pathname.replace(/\/$/, '') === URLS.nodesByFork ? 'by-fork' : 'default';
	return (
		<S.Wrapper>
			<ViewTitle
				header={language.nodes}
				headingLevel={'h1'}
				actions={[
					<Toggle
						label={language.nodesView}
						value={view}
						options={[
							{ value: 'default', label: language.nodesAll },
							{ value: 'by-fork', label: language.nodesByFork },
						]}
						onChange={(value) => navigate(value === 'by-fork' ? URLS.nodesByFork : URLS.nodes)}
					/>,
				]}
			/>
			<S.Content>{view === 'by-fork' ? <NodeForks /> : <NodesTable />}</S.Content>
		</S.Wrapper>
	);
}
