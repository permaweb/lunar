import React from 'react';

import * as S from '../styles/index';

import { ConfigFormField } from './ConfigFormField';

interface IConfigurationFormProps {
	configuration: any;
	data: any;
	setData: (data: any) => void;
}

export const ConfigurationForm: React.FC<IConfigurationFormProps> = ({ configuration, data, setData }) => {
	const handleFieldChange = (path: string, value: any) => {
		const newData = { ...data };
		const keys = path.split('.');
		let current = newData;

		// Navigate to the parent of the target field
		for (let i = 0; i < keys.length - 1; i++) {
			if (!current[keys[i]]) {
				current[keys[i]] = {};
			}
			current = current[keys[i]];
		}

		// Set the value (or remove if empty)
		const fieldKey = keys[keys.length - 1];
		if (
			value === '' ||
			value === null ||
			value === undefined ||
			(typeof value === 'string' && value.trim() === '') ||
			(typeof value === 'number' && value === 0)
		) {
			delete current[fieldKey];
		} else {
			current[fieldKey] = value;
		}

		setData(newData);
	};

	return (
		<S.ConfigurationFormContainer>
			{Object.keys(configuration).map((fieldKey) => (
				<ConfigFormField
					key={fieldKey}
					fieldKey={fieldKey}
					fieldConfig={configuration[fieldKey]}
					value={data?.[fieldKey]}
					onChange={handleFieldChange}
				/>
			))}
		</S.ConfigurationFormContainer>
	);
};
