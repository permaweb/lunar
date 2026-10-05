import * as S from './styles';

export default function Chevron(props: { isOpen: boolean; size?: number; variant?: 'disclosure' }) {
	return (
		<S.Icon
			viewBox="0 0 24 24"
			aria-hidden="true"
			focusable="false"
			$size={props.size ?? 17}
			$isOpen={props.isOpen}
			$variant={props.variant}
		>
			<S.Path d={S.getPath(props.isOpen, props.variant)} $isOpen={props.isOpen} $variant={props.variant} />
		</S.Icon>
	);
}
