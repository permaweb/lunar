import React from 'react';

import * as S from './styles';

export default function Toggle<T extends string>(props: {
	label: string;
	value: T;
	options: { value: T; label: string; disabled?: boolean }[];
	onChange: (value: T) => void;
}) {
	const name = React.useId();
	return (
		<S.Group role={'radiogroup'} aria-label={props.label}>
			{props.options.map((option) => (
				<S.Option key={option.value} $disabled={option.disabled}>
					<S.Input
						type={'radio'}
						name={name}
						value={option.value}
						checked={props.value === option.value}
						disabled={option.disabled}
						onChange={() => props.onChange(option.value)}
					/>
					<S.Label>{option.label}</S.Label>
				</S.Option>
			))}
		</S.Group>
	);
}
