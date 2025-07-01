import React from 'react';

import { Button } from 'components/atoms/Button';
import { FormField } from 'components/atoms/FormField';
import JSONWriter from 'components/molecules/JSONWriter/JSONWriter';
import { ValidationType } from 'helpers/types';

import * as S from '../styles/index';
import { IFieldConfig } from '../types';

interface IConfigFormFieldProps {
	fieldKey: string;
	fieldConfig: IFieldConfig;
	value: any;
	onChange: (path: string, value: any) => void;
	path?: string;
}

export const ConfigFormField: React.FC<IConfigFormFieldProps> = ({
	fieldKey,
	fieldConfig,
	value,
	onChange,
	path = '',
}) => {
	const fullPath = path ? `${path}.${fieldKey}` : fieldKey;

	const handleChange = (newValue: any) => {
		onChange(fullPath, newValue);
	};

	const renderField = () => {
		switch (fieldConfig.type) {
			case 'json':
				return (
					<S.JSONWriterWrapper>
						<JSONWriter
							initialData={value}
							handleSubmit={(jsonData) => handleChange(jsonData)}
							ignoreOnEnter={true}
							alt1={true}
							handleChange={(jsonData) => handleChange(jsonData)}
							loading={false}
							hideButton={true}
						/>
					</S.JSONWriterWrapper>
				);

			case 'array':
				const arrayValue = Array.isArray(value) ? value : [];
				return (
					<S.ArrayContainer>
						{arrayValue.map((item: any, index: number) => (
							<S.ArrayItem key={index}>
								<S.ArrayItemHeader>
									<strong>{index}</strong>
									<Button
										type={'alt3'}
										label={'Remove'}
										handlePress={() => {
											const newArray = arrayValue.filter((_: any, i: number) => i !== index);
											handleChange(newArray);
										}}
									/>
								</S.ArrayItemHeader>
								<S.ArrayItemContent>
									{fieldConfig.items &&
										Object.keys(fieldConfig.items).map((itemKey) => (
											<ConfigFormField
												key={itemKey}
												fieldKey={itemKey}
												fieldConfig={fieldConfig.items![itemKey]}
												value={item[itemKey]}
												onChange={(_itemPath, itemValue) => {
													const newArray = [...arrayValue];
													newArray[index] = { ...newArray[index], [itemKey]: itemValue };
													handleChange(newArray);
												}}
												path=""
											/>
										))}
								</S.ArrayItemContent>
							</S.ArrayItem>
						))}
					</S.ArrayContainer>
				);
		}
	};

	// For basic field types, use FormField with built-in labeling
	if (fieldConfig.type === 'string' || fieldConfig.type === 'number' || !fieldConfig.type) {
		// Create validation based on field configuration
		const validateField = (val: any): ValidationType => {
			const stringValue = String(val || '');
			const numericValue = Number(val || 0);

			// Skip validation for empty values
			if (!val && val !== 0) {
				return { status: false, message: null };
			}

			// String length validation
			if (fieldConfig.type === 'string' && fieldConfig.length) {
				if (stringValue.length !== fieldConfig.length) {
					return {
						status: true,
						message: `Must be exactly ${fieldConfig.length} characters`,
					};
				}
			}

			// Number minimum value validation
			if (fieldConfig.type === 'number' && fieldConfig.min_value !== undefined) {
				if (numericValue < fieldConfig.min_value) {
					return {
						status: true,
						message: `Must be at least ${fieldConfig.min_value}`,
					};
				}
			}

			return { status: false, message: null };
		};

		const validationState = validateField(value);

		return (
			<S.ConfigurationFormFieldWrapper className={fieldConfig.size}>
				<FormField
					label={fieldKey.replace(/_/g, ' ')}
					tooltip={fieldConfig.description}
					value={value || ''}
					sm={true}
					onChange={(e) => handleChange(fieldConfig.type === 'number' ? Number(e.target.value) : e.target.value)}
					placeholder={fieldConfig.placeholder}
					invalid={validationState}
					disabled={false}
					type={fieldConfig.type === 'number' ? 'number' : undefined}
				/>
			</S.ConfigurationFormFieldWrapper>
		);
	}

	// For complex field types (JSON, arrays), use custom styling
	return (
		<S.FormFieldWrapper>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<S.FormLabel>{fieldKey.replace(/_/g, ' ')}</S.FormLabel>
				{fieldConfig.type === 'array' && (
					<Button
						type={'alt3'}
						label={'Add Item'}
						handlePress={() => {
							const arrayValue = Array.isArray(value) ? value : [];
							const newItem = {};
							// Initialize with empty values for each field type
							if (fieldConfig.items) {
								Object.keys(fieldConfig.items).forEach((key) => {
									const itemConfig = fieldConfig.items![key];
									switch (itemConfig.type) {
										case 'string':
											newItem[key] = '';
											break;
										case 'number':
											newItem[key] = 0;
											break;
										default:
											newItem[key] = '';
									}
								});
							}
							handleChange([...arrayValue, newItem]);
						}}
					/>
				)}
			</div>
			<S.FormDescription>{fieldConfig.description}</S.FormDescription>
			{renderField()}
		</S.FormFieldWrapper>
	);
};
