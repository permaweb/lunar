import { formatPriceChange, formatUsdPrice } from 'helpers/prices';

import * as S from './styles';

export default function TokenPrice(props: {
	price: number | null;
	change24hPercent: number | null;
	priceLabel: string;
	changeLabel: string;
}) {
	const change = props.price === null ? null : formatPriceChange(props.change24hPercent);
	const percentage = props.change24hPercent ?? 0;
	const direction = Math.round(Math.abs(percentage) * 100) * Math.sign(percentage);
	return (
		<S.Wrapper>
			<span aria-label={props.priceLabel}>{formatUsdPrice(props.price)}</span>
			{change !== null && (
				<S.Change
					$direction={direction > 0 ? 'positive' : direction < 0 ? 'negative' : 'neutral'}
					title={props.changeLabel}
					aria-label={`${props.changeLabel}: ${change}`}
				>
					{change}
				</S.Change>
			)}
		</S.Wrapper>
	);
}
