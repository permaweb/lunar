import React from 'react';
import { ReactSVG } from 'react-svg';

import { ASSETS } from 'helpers/config';
import { SelectOptionType } from 'helpers/types';
import { CloseHandler } from 'wrappers/CloseHandler';

import * as S from './styles';
import { IProps } from './types';

export default function Select(props: IProps) {
	const [active, setActive] = React.useState<boolean>(false);

	return props.options && props.activeOption ? (
		<CloseHandler active={active} disabled={!active || props.disabled} callback={() => setActive(false)}>
			<S.Wrapper>
				{props.label && (
					<S.Label disabled={props.disabled}>
						<span>{props.label}</span>
					</S.Label>
				)}
				<S.Dropdown
					active={active}
					disabled={props.disabled}
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setActive(!active);
					}}
				>
					<span>{props.activeOption.label}</span>
					<ReactSVG src={ASSETS.arrow} />
				</S.Dropdown>
				{active && (
					<S.Options>
						{props.options.map((option: SelectOptionType, index: number) => {
							return (
								<S.Option
									key={index}
									active={option.id === props.activeOption.id}
									onClick={(e) => {
										e.stopPropagation();
										if (option.id !== props.activeOption.id) {
											props.setActiveOption(option);
										}
										setActive(false);
									}}
								>
									<S.OptionLabel>{option.label}</S.OptionLabel>
									{props.handleRemoveOption && (props.isOptionRemovable ? props.isOptionRemovable(option) : true) && (
										<S.RemoveOption
											type={'button'}
											aria-label={props.removeOptionLabel ?? 'Remove'}
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												props.handleRemoveOption(option);
											}}
										>
											<ReactSVG src={ASSETS.close} />
										</S.RemoveOption>
									)}
								</S.Option>
							);
						})}
					</S.Options>
				)}
			</S.Wrapper>
		</CloseHandler>
	) : null;
}
