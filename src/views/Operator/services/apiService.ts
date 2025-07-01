import { HTTP_CONFIG } from '../constants';
import { IAction, IDeviceAction, IServer } from '../types';
import { constructActionUrl, prepareRequestData, validateActionExecution } from '../utils';

export interface IExecutionResult {
	success: boolean;
	data?: any;
	error?: string;
	statusCode?: number;
}

export class ApiService {
	private static instance: ApiService;

	public static getInstance(): ApiService {
		if (!ApiService.instance) {
			ApiService.instance = new ApiService();
		}
		return ApiService.instance;
	}

	private constructor() {}

	async executeAction(
		pipelineItem: IAction,
		servers: IServer[],
		deviceAction: IDeviceAction
	): Promise<IExecutionResult> {
		const { action, parameters, actionKey } = pipelineItem;

		try {
			// Validate action requirements
			const validation = validateActionExecution(actionKey, action, parameters, servers);
			if (!validation.isValid) {
				return {
					success: false,
					error: validation.error,
				};
			}

			const { server } = validation;
			if (!server) {
				return {
					success: false,
					error: 'Server not found',
				};
			}

			// Construct request
			const fullUrl = constructActionUrl(server, deviceAction, action.url);
			const requestData = prepareRequestData(parameters, server.configuration);

			// Execute HTTP request
			const result = await this.makeHttpRequest(action.method, fullUrl, requestData);

			return {
				success: true,
				data: result.data,
				statusCode: result.statusCode,
			};
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
				statusCode: error.statusCode,
			};
		}
	}

	private async makeHttpRequest(method: string, url: string, data?: any): Promise<{ data: any; statusCode: number }> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), HTTP_CONFIG.TIMEOUT);

		try {
			const requestOptions: RequestInit = {
				method,
				headers: {
					...HTTP_CONFIG.DEFAULT_HEADERS,
				},
				signal: controller.signal,
			};

			// Add body for POST/PUT requests
			if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && data && Object.keys(data).length > 0) {
				requestOptions.body = JSON.stringify(data);
			}

			console.log(`🚀 Executing: ${method} ${url}`);
			if (data && Object.keys(data).length > 0) {
				console.log('📦 Request data:', data);
			}

			const response = await fetch(url, requestOptions);
			clearTimeout(timeoutId);

			const responseText = await response.text();
			let responseData: any = responseText;

			// Try to parse as JSON if possible
			try {
				responseData = JSON.parse(responseText);
			} catch {
				// Keep as text if not valid JSON
			}

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}\n${responseText}`);
			}

			console.log('✅ Request successful');
			return {
				data: responseData,
				statusCode: response.status,
			};
		} catch (error: any) {
			clearTimeout(timeoutId);

			if (error.name === 'AbortError') {
				throw new Error(`Request timeout after ${HTTP_CONFIG.TIMEOUT}ms`);
			}

			console.error('❌ Request failed:', error.message);
			throw error;
		}
	}

	// Batch execution with concurrency control
	async executeBatch(
		pipelineItems: IAction[],
		servers: IServer[],
		deviceActions: IDeviceAction[],
		options: { maxConcurrency?: number; onProgress?: (completed: number, total: number) => void } = {}
	): Promise<IExecutionResult[]> {
		const { maxConcurrency = 3, onProgress } = options;
		const results: IExecutionResult[] = [];
		let completed = 0;

		const executeWithSemaphore = async (item: IAction, index: number): Promise<void> => {
			const deviceAction = deviceActions.find((da) => da.label === item.deviceLabel);
			if (!deviceAction) {
				results[index] = {
					success: false,
					error: `Device action not found: ${item.deviceLabel}`,
				};
				return;
			}

			try {
				results[index] = await this.executeAction(item, servers, deviceAction);
			} catch (error: any) {
				results[index] = {
					success: false,
					error: error.message,
				};
			} finally {
				completed++;
				onProgress?.(completed, pipelineItems.length);
			}
		};

		// Execute with concurrency control
		// const semaphore = new Array(maxConcurrency).fill(null);
		const promises: Promise<void>[] = [];

		for (let i = 0; i < pipelineItems.length; i++) {
			const promise = Promise.resolve().then(() => executeWithSemaphore(pipelineItems[i], i));
			promises.push(promise);

			// Wait if we've reached max concurrency
			if (promises.length >= maxConcurrency) {
				await Promise.race(promises);
				// Remove completed promises
				const completedIndex = promises.findIndex((p) => p !== promise);
				if (completedIndex !== -1) {
					promises.splice(completedIndex, 1);
				}
			}
		}

		// Wait for all remaining promises
		await Promise.all(promises);

		return results;
	}
}

// Export singleton instance
export const apiService = ApiService.getInstance();
