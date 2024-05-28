// based on https://github.com/synonymdev/slashtags-profile/blob/main/index.js

import b4a from 'b4a';
import { default as Ajv } from 'ajv';
import Client from '@synonymdev/web-relay/types/lib/client/index';

import { SlashPayConfig } from '../../store/types/slashtags';

const SLASHPAY_PATH = '/slashpay.json';
const SLASHPAY_SCHEMA = {
	$schema: 'http://json-schema.org/draft-07/schema#',
	title: 'Slashpay',
	type: 'array',
	items: {
		$ref: '#/definitions/Item',
	},
	definitions: {
		Item: {
			type: 'object',
			properties: {
				type: {
					type: 'string',
				},
				value: {
					type: 'string',
				},
			},
			required: ['type', 'value'],
		},
	},
};

const ajv = new Ajv({ allErrors: true });
const _validate = ajv.compile(SLASHPAY_SCHEMA);

export default class SlashpayConfig {
	_client: Client;
	constructor(client: Client) {
		this._client = client;
	}

	/**
	 * Create a url of the config file
	 */
	async createURL(): Promise<string> {
		return this._client.createURL(SLASHPAY_PATH);
	}

	/**
	 * Absolute for the config path
	 *
	 * @returns {string}
	 */
	static get path(): string {
		return SLASHPAY_PATH;
	}

	/**
	 * Create or update a Config file.
	 *
	 * @param {SlashPayConfig} config
	 *
	 * @returns {Promise<void>}
	 */
	put(config: SlashPayConfig): Promise<void> {
		validate(config);
		return this._client.put(SLASHPAY_PATH, encode(config));
	}

	/**
	 * Delete Config file.
	 *
	 * @returns {Promise<void>}
	 */
	del(): Promise<void> {
		return this._client.del(SLASHPAY_PATH);
	}

	/**
	 * Return local Config file
	 *
	 * @param {string} [url]
	 *
	 * @returns {Promise<SlashPayConfig | null>}
	 */
	async get(url: string): Promise<SlashPayConfig | null> {
		const buf = url
			? await this._client.get(url, { skipCache: true })
			: await this._client.get(SLASHPAY_PATH, { skipCache: true });

		return buf && decode(buf);
	}

	/**
	 * Subscribe to updates to a local or remote config file.
	 *
	 * @param {string} url
	 * @param {(curr: SlashPayConfig) => any} onupdate
	 *
	 * @returns {() => void}
	 */
	subscribe(url: string, onupdate: (curr: SlashPayConfig) => any): () => void {
		return this._client.subscribe(url, (buf) => {
			if (!buf) {
				return;
			}
			const res = decode(buf);
			if (res === null) {
				return;
			}
			onupdate(res);
		});
	}

	/**
	 * Close core data instance
	 *
	 * @returns {Promise<void>}
	 */
	close(): Promise<void> {
		return this._client.close();
	}
}

/**
 * Encode config json into Uint8Array.
 *
 * @param {SlashPayConfig} config
 *
 * @returns {Uint8Array}
 */
function encode(config: SlashPayConfig): Uint8Array {
	return b4a.from(JSON.stringify(config));
}

/**
 * Try to decode Uint8Array into config json.
 *
 * @param{Uint8Array} buf
 *
 * @returns {SlashPayConfig | null}
 */
function decode(buf: Uint8Array): SlashPayConfig | null {
	try {
		return JSON.parse(b4a.toString(buf));
	} catch {
		return null;
	}
}

/**
 * Validate slashpay json.
 *
 * @param {SlashPayConfig} config
 */
function validate(config: SlashPayConfig): void {
	const valid = _validate(config);
	if (!valid) {
		let message = '';
		if (_validate.errors) {
			message = _validate.errors
				.map((error) => {
					let name = 'config';
					// @ts-ignore
					if (error.instancePath !== '') {
						// @ts-ignore eslint-disable-next-line no-mixed-spaces-and-tabs
						name = `Field '${error.instancePath.slice(1)}'`;
					}

					return ` - ${name} ${error.message}`;
				})
				.join('\n');
		}

		throw new Error('Invalid slashpay config:\n' + message);
	}
}
