import { ASSETS } from 'helpers/config';

import { Icon } from '../Icon';

import * as S from './styles';

export default function ExternalLink(props: {
	href: string;
	label: string;
	title?: string;
	size?: 'default' | 'small';
	tone?: 'default' | 'muted';
}) {
	return (
		<S.Link
			href={props.href}
			target={'_blank'}
			rel={'noopener noreferrer'}
			title={props.title}
			$small={props.size === 'small'}
			$muted={props.tone === 'muted'}
		>
			<span>{props.label}</span>
			<Icon src={ASSETS.newTab} size={props.size === 'small' ? 13 : 14} />
		</S.Link>
	);
}
