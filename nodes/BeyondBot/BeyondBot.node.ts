import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';

export class BeyondBot implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Beyond-Bot',
		name: 'beyondBot',
		icon: 'file:beyondbot.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Beyond-Bot.ai API',
		defaults: {
			name: 'Beyond-Bot',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'beyondBotApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.apiUrl}}',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Assistant',
						value: 'assistant',
					},
				],
				default: 'assistant',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['assistant'],
					},
				},
				options: [
					{
						name: 'Execute',
						value: 'execute',
						description: 'Execute an assistant',
						action: 'Execute an assistant',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get assistant details',
						action: 'Get assistant details',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all assistants',
						action: 'List all assistants',
					},
				],
				default: 'execute',
			},
			{
				displayName: 'Assistant ID',
				name: 'assistantId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['execute', 'get'],
					},
				},
				default: '',
				description: 'The ID of the assistant to use',
			},
			{
				displayName: 'Input',
				name: 'input',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['assistant'],
						operation: ['execute'],
					},
				},
				default: '',
				description: 'The input for the assistant',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'assistant') {
					if (operation === 'execute') {
						const assistantId = this.getNodeParameter('assistantId', i) as string;
						const input = this.getNodeParameter('input', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'POST',
							url: `/assistants/${assistantId}/execute`,
							body: {
								input,
							},
						});

						returnData.push({
							json: response,
							pairedItem: i,
						});
					} else if (operation === 'get') {
						const assistantId = this.getNodeParameter('assistantId', i) as string;

						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: `/assistants/${assistantId}`,
						});

						returnData.push({
							json: response,
							pairedItem: i,
						});
					} else if (operation === 'list') {
						const response = await this.helpers.httpRequest({
							method: 'GET',
							url: '/assistants',
						});

						returnData.push({
							json: response,
							pairedItem: i,
						});
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: i,
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}