import React from 'react';

import { Select } from 'components/atoms/Select';
import JSONWriter from 'components/molecules/JSONWriter/JSONWriter';

import * as S from '../styles/index';
import { IServer } from '../types';

interface IParameterFieldProps {
	param: any;
	value: any;
	onChange: (value: any) => void;
	servers: IServer[];
}

export const ParameterField: React.FC<IParameterFieldProps> = ({ param, value, onChange, servers }) => {
	switch (param.type) {
		case 'server':
			const placeholderOption = { id: '', label: 'Select server...' };
			const serverOptions = [
				placeholderOption,
				...servers.map((server) => ({
					id: server.name,
					label: `${server.name} (${server.url})`,
				})),
			];

			const activeServerOption = value
				? serverOptions.find((option) => option.id === value) || placeholderOption
				: placeholderOption;

			return (
				<S.ParameterField>
					<Select
						label={param.name}
						options={serverOptions}
						activeOption={activeServerOption}
						setActiveOption={(option) => onChange(option.id === '' ? '' : option.id)}
						disabled={false}
					/>
				</S.ParameterField>
			);

		case 'json':
			return (
				<S.ParameterField>
					<S.ParameterLabel>{param.name}</S.ParameterLabel>
					<S.JSONParameterWrapper>
						<JSONWriter
							initialData={value || {}}
							handleChange={(jsonData) => onChange(jsonData)}
							loading={false}
							hideButton={true}
							ignoreOnEnter={true}
							alt1={true}
						/>
					</S.JSONParameterWrapper>
				</S.ParameterField>
			);

		default:
			return (
				<S.ParameterField>
					<S.ParameterLabel>{param.name}</S.ParameterLabel>
					<S.ParameterInput
						type="text"
						value={value || ''}
						onChange={(e) => onChange(e.target.value)}
						placeholder={`Enter ${param.name}...`}
					/>
				</S.ParameterField>
			);
	}
};
