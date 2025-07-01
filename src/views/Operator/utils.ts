import { device_actions } from './actions';
import { IDeviceAction, IServer } from './types';

// Helper function to remove empty values from data
export const cleanEmptyValues = (obj: any): any => {
	if (Array.isArray(obj)) {
		const cleanedArray = obj
			.map((item) => cleanEmptyValues(item))
			.filter((item) => {
				// Remove empty objects, empty strings, null, undefined
				if (item === null || item === undefined || item === '') return false;
				if (typeof item === 'object' && Object.keys(item).length === 0) return false;
				return true;
			});
		return cleanedArray.length > 0 ? cleanedArray : undefined;
	}

	if (obj !== null && typeof obj === 'object') {
		const cleanedObj: any = {};

		Object.keys(obj).forEach((key) => {
			const value = obj[key];

			// Skip empty strings, null, undefined, zero-length strings, and zero values
			if (value === null || value === undefined) return;
			if (typeof value === 'string' && value.trim() === '') return;
			if (typeof value === 'number' && (isNaN(value) || value === 0)) return;

			const cleanedValue = cleanEmptyValues(value);

			// Only include non-empty values
			if (cleanedValue !== undefined && cleanedValue !== null) {
				cleanedObj[key] = cleanedValue;
			}
		});

		return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
	}

	// Handle primitive values
	if (typeof obj === 'string') {
		return obj.trim() === '' ? undefined : obj;
	}
	if (typeof obj === 'number') {
		return isNaN(obj) || obj === 0 ? undefined : obj;
	}

	return obj;
};

// Generate unique ID for pipeline items
export const generateUniqueId = (deviceId: string, actionKey: string): string => {
	return `${deviceId}-${actionKey}-${Date.now()}-${Math.random()}`;
};

// Initialize parameters for new pipeline items
export const initializeParameters = (action: any, currentServer?: string): Record<string, any> => {
	const initialParameters: Record<string, any> = {};

	if (action.params) {
		action.params.forEach((param: any) => {
			switch (param.type) {
				case 'server':
					initialParameters[param.name] = currentServer || '';
					break;
				case 'json':
					initialParameters[param.name] = {};
					break;
				default:
					initialParameters[param.name] = '';
			}
		});
	}

	return initialParameters;
};

// Construct URL for action execution
export const constructActionUrl = (server: IServer, deviceAction: IDeviceAction, actionUrl: string): string => {
	// Construct URL with proper handling
	const baseUrl = server.url.endsWith('/') ? server.url.slice(0, -1) : server.url;

	// Handle baseUrl - ensure it starts with /
	let actionBaseUrl = deviceAction.baseUrl;
	if (!actionBaseUrl.startsWith('/')) {
		actionBaseUrl = '/' + actionBaseUrl;
	}
	// Remove trailing slash if present
	if (actionBaseUrl.endsWith('/')) {
		actionBaseUrl = actionBaseUrl.slice(0, -1);
	}

	// Handle action URL
	let finalActionUrl = actionUrl;
	if (!finalActionUrl.startsWith('/')) {
		finalActionUrl = '/' + finalActionUrl;
	}

	return `${baseUrl}${actionBaseUrl}${finalActionUrl}`;
};

// Prepare request data for action execution
export const prepareRequestData = (
	parameters: Record<string, any> | undefined,
	serverConfiguration: any
): Record<string, any> => {
	const requestData: any = {};

	if (parameters) {
		Object.keys(parameters).forEach((key) => {
			if (key !== 'server' && parameters[key] !== undefined && parameters[key] !== '') {
				if (key === 'config') {
					// Use server configuration for config parameter
					requestData[key] = serverConfiguration || {};
				} else {
					requestData[key] = parameters[key];
				}
			}
		});
	}

	return requestData;
};

// Find device action by label
export const findDeviceAction = (deviceLabel: string): IDeviceAction | undefined => {
	return device_actions.find((d) => d.label === deviceLabel);
};

// Validate action execution requirements
export const validateActionExecution = (
	actionKey: string,
	action: any,
	parameters: Record<string, any> | undefined,
	servers: IServer[]
): { isValid: boolean; error?: string; server?: IServer; deviceAction?: IDeviceAction } => {
	// Validate basic structure
	if (!action) {
		return { isValid: false, error: `Action definition missing for ${actionKey}` };
	}

	if (!action.url) {
		return { isValid: false, error: `Action URL missing for ${actionKey}` };
	}

	if (!action.method) {
		return { isValid: false, error: `Action method missing for ${actionKey}` };
	}

	// Get server configuration
	const serverName = parameters?.server;
	if (!serverName) {
		return {
			isValid: false,
			error: `No server selected for action ${actionKey}. Please select a server in the parameter configuration.`,
		};
	}

	const server = servers.find((s) => s.name === serverName);
	if (!server) {
		return { isValid: false, error: `Server "${serverName}" not found` };
	}

	return { isValid: true, server };
};
