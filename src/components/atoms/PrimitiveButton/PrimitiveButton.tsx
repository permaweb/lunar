import React from 'react';

import * as S from './styles';

const PrimitiveButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
	function PrimitiveButton(props, ref) {
		return <S.Button ref={ref} {...props} />;
	}
);

export default PrimitiveButton;
