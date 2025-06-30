import React from 'react';

import { Button } from 'components/atoms/Button';
import { SelectOptionType } from 'helpers/types';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';
import { IProps } from './types';

export default function Select(props: IProps) {
	const [active, setActive] = React.useState<boolean>(false);

	return props.options && props.options.length > 0 ? (
		<CloseHandler active={active} disabled={!active || props.disabled} callback={() => setActive(false)}>
			<S.Wrapper>
				{!active && (
					<S.CustomButton>
						<Button
							type={'primary'}
							label={props.label}
							disabled={props.disabled}
							handlePress={() => setActive(!active)}
						/>
					</S.CustomButton>
				)}
				{active && (
					<S.CustomButton>
						<Button
							type={'alt1'}
							label={props.label}
							disabled={props.disabled}
							handlePress={() => setActive(!active)}
						/>
					</S.CustomButton>
				)}

				{active && (
					<S.Options className={'border-wrapper-primary'}>
						{props.options.map((option: SelectOptionType, index: number) => {
							return (
								<S.Option
									key={index}
									onClick={() => {
										props.options[index].fn();
										setActive(false);
									}}
								>
									{option.label}
								</S.Option>
							);
						})}
					</S.Options>
				)}
			</S.Wrapper>
		</CloseHandler>
	) : null;
}
