import { ASSETS } from 'helpers/config';

import { Icon } from '../Icon';

import * as S from './styles';

export default function ExternalLink(props: { href: string; label: string; title?: string }) {
	return (
		<S.Link href={props.href} target={'_blank'} rel={'noopener noreferrer'} title={props.title}>
			<span>{props.label}</span>
			<Icon src={ASSETS.newTab} size={12.5} />
		</S.Link>
	);
}
