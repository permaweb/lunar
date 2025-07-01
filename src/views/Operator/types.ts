export interface ISettings {
	servers: IServer[];
	actions: IAction[];
	currentServer?: string;
	selectedDevice?: string;
}

export interface IServer {
	name: string;
	url: string;
	configuration: any;
}

export interface IAction {
	id: string;
	deviceId: string;
	deviceLabel: string;
	actionKey: string;
	action: any;
	uniqueId: string;
	baseUrl: string;
	parameters?: Record<string, any>;
}

export interface IDeviceAction {
	id: string;
	label: string;
	baseUrl: string;
	actions: Record<string, IActionDefinition>;
}

export interface IActionDefinition {
	method: string;
	url: string;
	description: string;
	params?: IActionParam[];
}

export interface IActionParam {
	name: string;
	type?: string;
}

export interface IDevice {
	id: string;
	label: string;
	configuration: Record<string, IFieldConfig>;
}

export interface IFieldConfig {
	type: string;
	description: string;
	size?: string;
	placeholder?: string;
	length?: number;
	min_value?: number;
	items?: Record<string, IFieldConfig>;
}

export interface IPipelineResult {
	actionKey: string;
	deviceLabel: string;
	serverName: string;
	result: any;
	success: boolean;
	error?: string;
}

export interface ILayoutProps {
	activeTab: number;
	setActiveTab?: (tab: number) => void;
	settings: ISettings;
	setSettings: (settings: ISettings) => void;
}
