import { executePlaygroundQuery, getPlaygroundGatewayInputValue } from './playground';
import { GraphQLApiError, isRecord } from './types';

export type GQLTypeRef = {
	kind: string;
	name?: string | null;
	ofType?: GQLTypeRef | null;
};

export type GQLInputValue = {
	name: string;
	description?: string | null;
	defaultValue?: string | null;
	type: GQLTypeRef;
};

export type GQLField = {
	name: string;
	description?: string | null;
	args?: GQLInputValue[];
	type: GQLTypeRef;
	isDeprecated?: boolean;
	deprecationReason?: string | null;
};

export type GQLEnumValue = {
	name: string;
	description?: string | null;
	isDeprecated?: boolean;
	deprecationReason?: string | null;
};

export type GQLType = {
	kind: string;
	name: string;
	description?: string | null;
	fields?: GQLField[] | null;
	inputFields?: GQLInputValue[] | null;
	enumValues?: GQLEnumValue[] | null;
};

export type GQLSchemaDocs = {
	queryType?: { name: string } | null;
	mutationType?: { name: string } | null;
	subscriptionType?: { name: string } | null;
	types: GQLType[];
};

const SCHEMA_CACHE = new Map<string, GQLSchemaDocs>();
const SCHEMA_REQUEST_CACHE = new Map<string, Promise<GQLSchemaDocs>>();

const INTROSPECTION_QUERY = `
	query LunarSchemaDocs {
		__schema {
			queryType { name }
			mutationType { name }
			subscriptionType { name }
			types {
				kind
				name
				description
				fields(includeDeprecated: true) {
					name
					description
					args {
						name
						description
						defaultValue
						type { ...TypeRef }
					}
					type { ...TypeRef }
					isDeprecated
					deprecationReason
				}
				inputFields {
					name
					description
					defaultValue
					type { ...TypeRef }
				}
				enumValues(includeDeprecated: true) {
					name
					description
					isDeprecated
					deprecationReason
				}
			}
		}
	}
	fragment TypeRef on __Type {
		kind
		name
		ofType {
			kind
			name
			ofType {
				kind
				name
				ofType {
					kind
					name
					ofType { kind name }
				}
			}
		}
	}
`;

function isOptionalString(value: unknown): boolean {
	return value == null || typeof value === 'string';
}

function isNamedValue(value: unknown): value is Record<string, unknown> & { name: string } {
	return isRecord(value) && typeof value.name === 'string' && isOptionalString(value.description);
}

function isTypeRef(value: unknown, depth = 0): value is GQLTypeRef {
	return (
		depth < 16 &&
		isRecord(value) &&
		typeof value.kind === 'string' &&
		isOptionalString(value.name) &&
		(value.ofType == null || isTypeRef(value.ofType, depth + 1))
	);
}

function isInputValue(value: unknown): value is GQLInputValue {
	return isNamedValue(value) && isOptionalString(value.defaultValue) && isTypeRef(value.type);
}

function hasValidDeprecation(value: Record<string, unknown>): boolean {
	return (
		(value.isDeprecated == null || typeof value.isDeprecated === 'boolean') && isOptionalString(value.deprecationReason)
	);
}

function isField(value: unknown): value is GQLField {
	return (
		isNamedValue(value) &&
		isTypeRef(value.type) &&
		hasValidDeprecation(value) &&
		(value.args === undefined || (Array.isArray(value.args) && value.args.every(isInputValue)))
	);
}

function isSchemaType(value: unknown): value is GQLType {
	return (
		isNamedValue(value) &&
		typeof value.kind === 'string' &&
		(value.fields == null || (Array.isArray(value.fields) && value.fields.every(isField))) &&
		(value.inputFields == null || (Array.isArray(value.inputFields) && value.inputFields.every(isInputValue))) &&
		(value.enumValues == null ||
			(Array.isArray(value.enumValues) &&
				value.enumValues.every((entry) => isNamedValue(entry) && hasValidDeprecation(entry))))
	);
}

function isSchemaDocs(value: unknown): value is GQLSchemaDocs {
	return (
		isRecord(value) &&
		Array.isArray(value.types) &&
		value.types.every(isSchemaType) &&
		[value.queryType, value.mutationType, value.subscriptionType].every((root) => root == null || isNamedValue(root))
	);
}

export async function fetchSchemaDocs(gateway: string, signal?: AbortSignal): Promise<GQLSchemaDocs> {
	const key = getPlaygroundGatewayInputValue(gateway);
	if (signal?.aborted) throw new GraphQLApiError('cancelled', 'Schema request cancelled');
	const cached = SCHEMA_CACHE.get(key);
	if (cached) return cached;

	// Abortable callers own their request so closing one tab cannot cancel another tab's docs.
	const pending = !signal && SCHEMA_REQUEST_CACHE.get(key);
	if (pending) return pending;

	const request = executePlaygroundQuery({ query: INTROSPECTION_QUERY, gateway, signal })
		.then((payload) => {
			if (payload.errors?.length) {
				throw new GraphQLApiError('unavailable', payload.errors[0].message);
			}
			const schema = payload.data?.__schema;
			if (!isSchemaDocs(schema)) {
				throw new GraphQLApiError('invalid-response', 'Gateway returned an invalid GraphQL schema');
			}
			SCHEMA_CACHE.set(key, schema);
			return schema;
		})
		.finally(() => {
			if (!signal) SCHEMA_REQUEST_CACHE.delete(key);
		});
	if (!signal) SCHEMA_REQUEST_CACHE.set(key, request);
	return request;
}
