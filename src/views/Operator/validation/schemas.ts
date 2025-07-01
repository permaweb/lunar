import { IFieldConfig } from '../types';

export interface IValidationResult {
	isValid: boolean;
	errors: string[];
}

export class ValidationSchema {
	static validateFieldValue(value: any, config: IFieldConfig): IValidationResult {
		const errors: string[] = [];

		// Skip validation for empty values (unless required)
		if (value === null || value === undefined || value === '') {
			if (config.required) {
				errors.push('This field is required');
			}
			return { isValid: errors.length === 0, errors };
		}

		// Type-specific validation
		switch (config.type) {
			case 'string':
				if (typeof value !== 'string') {
					errors.push('Value must be a string');
					break;
				}

				if (config.length && value.length !== config.length) {
					errors.push(`Must be exactly ${config.length} characters`);
				}

				if (config.minLength && value.length < config.minLength) {
					errors.push(`Must be at least ${config.minLength} characters`);
				}

				if (config.maxLength && value.length > config.maxLength) {
					errors.push(`Must be no more than ${config.maxLength} characters`);
				}

				if (config.pattern) {
					const regex = new RegExp(config.pattern);
					if (!regex.test(value)) {
						errors.push(config.patternMessage || 'Invalid format');
					}
				}
				break;

			case 'number':
				const numValue = Number(value);
				if (isNaN(numValue)) {
					errors.push('Value must be a number');
					break;
				}

				if (config.min_value !== undefined && numValue < config.min_value) {
					errors.push(`Must be at least ${config.min_value}`);
				}

				if (config.max_value !== undefined && numValue > config.max_value) {
					errors.push(`Must be no more than ${config.max_value}`);
				}
				break;

			case 'json':
				if (typeof value === 'string') {
					try {
						JSON.parse(value);
					} catch {
						errors.push('Must be valid JSON');
					}
				} else if (typeof value !== 'object') {
					errors.push('Must be a valid JSON object');
				}
				break;

			case 'array':
				if (!Array.isArray(value)) {
					errors.push('Value must be an array');
					break;
				}

				if (config.minItems && value.length < config.minItems) {
					errors.push(`Must have at least ${config.minItems} items`);
				}

				if (config.maxItems && value.length > config.maxItems) {
					errors.push(`Must have no more than ${config.maxItems} items`);
				}

				// Validate array items if schema provided
				if (config.items) {
					value.forEach((item, index) => {
						Object.keys(config.items!).forEach((key) => {
							const itemConfig = config.items![key];
							const itemValue = item[key];
							const itemValidation = this.validateFieldValue(itemValue, itemConfig);
							if (!itemValidation.isValid) {
								errors.push(`Item ${index + 1}, ${key}: ${itemValidation.errors.join(', ')}`);
							}
						});
					});
				}
				break;
		}

		return { isValid: errors.length === 0, errors };
	}

	static validateConfiguration(data: any, schema: Record<string, IFieldConfig>): IValidationResult {
		const errors: string[] = [];

		Object.keys(schema).forEach((fieldKey) => {
			const fieldConfig = schema[fieldKey];
			const fieldValue = data?.[fieldKey];
			const fieldValidation = this.validateFieldValue(fieldValue, fieldConfig);

			if (!fieldValidation.isValid) {
				fieldValidation.errors.forEach((error) => {
					errors.push(`${fieldKey}: ${error}`);
				});
			}
		});

		return { isValid: errors.length === 0, errors };
	}

	static validateServerUrl(url: string): IValidationResult {
		const errors: string[] = [];

		if (!url) {
			errors.push('URL is required');
			return { isValid: false, errors };
		}

		try {
			const urlObj = new URL(url);
			if (!['http:', 'https:'].includes(urlObj.protocol)) {
				errors.push('URL must use HTTP or HTTPS protocol');
			}
		} catch {
			errors.push('Invalid URL format');
		}

		return { isValid: errors.length === 0, errors };
	}

	static validateServerName(name: string, existingNames: string[] = []): IValidationResult {
		const errors: string[] = [];

		if (!name || name.trim() === '') {
			errors.push('Server name is required');
		} else if (existingNames.includes(name)) {
			errors.push('Server name already exists');
		} else if (name.length < 2) {
			errors.push('Server name must be at least 2 characters');
		} else if (name.length > 50) {
			errors.push('Server name must be no more than 50 characters');
		} else if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
			errors.push('Server name can only contain letters, numbers, spaces, hyphens, and underscores');
		}

		return { isValid: errors.length === 0, errors };
	}
}

// Enhanced field config interface with additional validation options
declare module '../types' {
	interface IFieldConfig {
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		pattern?: string;
		patternMessage?: string;
		min_value?: number;
		max_value?: number;
		minItems?: number;
		maxItems?: number;
	}
}
