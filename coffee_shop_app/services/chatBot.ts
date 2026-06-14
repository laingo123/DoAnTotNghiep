import axios from 'axios';
import { MessageInterface } from '@/types/types';
import { API_KEY, API_URL } from '@/config/runpodConfigs';

type RunPodResponse = {
    id?: string;
    status?: string;
    error?: string;
    output?: unknown;
};

const COMPLETED_STATUS = 'COMPLETED';
const FAILED_STATUSES = ['FAILED', 'CANCELLED', 'TIMED_OUT'];
const MAX_STATUS_CHECKS = 30;
const STATUS_CHECK_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function getStatusUrl(requestId: string) {
    return API_URL.replace(/\/runsync\/?$/i, '').replace(/\/run\/?$/i, '') + `/status/${requestId}`;
}

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null;
}

function extractCompletionMessage(value: unknown): MessageInterface | undefined {
    const completion = Array.isArray(value) ? value[0] : value;

    if (!isRecord(completion) || !Array.isArray(completion.choices)) {
        return undefined;
    }

    const message = completion.choices[0]?.message;
    if (!isRecord(message) || typeof message.content !== 'string') {
        return undefined;
    }

    return {
        role: typeof message.role === 'string' ? message.role : 'assistant',
        content: message.content,
    };
}

function extractMessage(value: unknown): MessageInterface | undefined {
    if (!isRecord(value)) {
        return extractCompletionMessage(value);
    }

    if (typeof value.content === 'string') {
        return {
            role: typeof value.role === 'string' ? value.role : 'assistant',
            content: value.content,
            memory: value.memory,
        };
    }

    return extractCompletionMessage(value) || extractMessage(value.output);
}

function extractOutputMessage(data: RunPodResponse): MessageInterface | undefined {
    return extractMessage(data?.output) || extractCompletionMessage(data);
}

function getRunPodErrorMessage(data: RunPodResponse): string | undefined {
    if (!data?.error) {
        return undefined;
    }

    try {
        const parsedError = JSON.parse(data.error);
        return parsedError.error_message || data.error;
    } catch {
        return data.error;
    }
}

function throwIfRunPodFailed(data: RunPodResponse) {
    const errorMessage = getRunPodErrorMessage(data);
    if (errorMessage || FAILED_STATUSES.includes(data?.status || '')) {
        throw new Error(errorMessage || `RunPod request failed with status ${data.status}.`);
    }
}

async function callChatBotAPI(messages: MessageInterface[]): Promise<MessageInterface> {
    try {
        const response = await axios.post(API_URL, {
            input: { messages }
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            }
        });

        let responseData: RunPodResponse = response.data;
        throwIfRunPodFailed(responseData);

        let outputMessage = extractOutputMessage(responseData);

        if (outputMessage) {
            return outputMessage;
        }

        if (responseData?.id && responseData?.status !== COMPLETED_STATUS) {
            const statusUrl = getStatusUrl(responseData.id);

            for (let attempt = 0; attempt < MAX_STATUS_CHECKS; attempt++) {
                await sleep(STATUS_CHECK_DELAY_MS);

                const statusResponse = await axios.get(statusUrl, {
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`
                    }
                });

                responseData = statusResponse.data;
                throwIfRunPodFailed(responseData);

                outputMessage = extractOutputMessage(responseData);

                if (responseData?.status === COMPLETED_STATUS && outputMessage) {
                    return outputMessage;
                }
            }
        }

        throw new Error('Chatbot response completed without a valid message.');
    } catch (error) {
        console.error('Error calling the API:', error);
        throw error;
    }
}

export { callChatBotAPI };
