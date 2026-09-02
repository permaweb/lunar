import React from 'react';

import * as S from './styles';

const PrimitiveInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
	function PrimitiveInput(props, ref) {
		return <S.Input ref={ref} {...props} />;
	}
);

export default PrimitiveInput;
