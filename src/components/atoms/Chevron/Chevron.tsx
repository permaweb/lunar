import * as S from './styles';

export default function Chevron(props: { isOpen: boolean; size?: number }) {
	return (
		<S.Icon viewBox="0 0 24 24" aria-hidden="true" focusable="false" $size={props.size ?? 17}>
			<S.Path d={props.isOpen ? S.UP_PATH : S.DOWN_PATH} $isOpen={props.isOpen} />
		</S.Icon>
	);
}
