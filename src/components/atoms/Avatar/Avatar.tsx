import React from 'react';
import { ReactSVG } from 'react-svg';

import { ASSETS } from 'helpers/config';
import { getProfileImageUrl } from 'helpers/profile';

import * as S from './styles';
import { IProps } from './types';

export default function Avatar(props: IProps) {
	const [hasError, setHasError] = React.useState(false);

	const imageUrl = getProfileImageUrl(props.owner?.thumbnail);
	const hasImage = !!imageUrl && !hasError;
	React.useEffect(() => setHasError(false), [imageUrl]);

	const thumbnail = React.useMemo(() => {
		if (!hasError && imageUrl) {
			return <img src={imageUrl} alt={''} onError={() => setHasError(true)} />;
		} else return <ReactSVG src={ASSETS.user} />;
	}, [imageUrl, hasError]);

	return (
		<S.Wrapper
			onClick={props.callback ? props.callback : () => {}}
			dimensions={props.dimensions}
			hasCallback={props.callback !== null}
			hasOwner={props.owner !== null || props.isConnected}
			hasImage={hasImage}
		>
			{thumbnail}
		</S.Wrapper>
	);
}
