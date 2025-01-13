import { Platform } from 'react-native';
import {
	getBuildNumber,
	getSystemVersion,
	getVersion,
} from 'react-native-device-info';
import { getStore } from '../store/helpers';
import { getNodeId, getNodeVersion } from './lightning';

const SUPPORT_EMAIL = 'support@synonym.to';

/**
 * Support link for opening device mail app.
 * Includes an optional message, device details, app version and LDK node info.
 * @param {string} [subject]
 * @param {string} [message]
 * @returns {Promise<`mailto:support@synonym.to?subject=Bitkit support&body=${string}`>}
 */
export const createSupportLink = async (
	subject?: string,
	message?: string,
): Promise<string> => {
	subject = subject ?? 'Bitkit Support';
	let body = '';

	if (message) {
		body += `${message}\n`;
	}

	body += `\nPlatform: ${Platform.OS} ${getSystemVersion()}`;
	body += `\nVersion: ${getVersion()} (${getBuildNumber()})`;

	const ldkVersion = await getNodeVersion();
	if (ldkVersion.isOk()) {
		body += `\nLDK version: ldk-${ldkVersion.value.ldk} c_bindings-${ldkVersion.value.c_bindings})`;
	}

	const nodeId = await getNodeId();
	if (nodeId.isOk()) {
		body += `\nLDK node ID: ${nodeId.value}`;
	}

	subject = encodeURIComponent(subject);
	body = encodeURIComponent(body);

	return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
};

/**
 * Support link for opening device mail app.
 * Includes BT orders, device details, app version and LDK node info.
 * @param orderId
 * @param additionalContext
 * @returns {Promise<`mailto:support@synonym.to?subject=Bitkit support&body=${string}`>}
 */
export const createOrderSupportLink = async (
	orderId: string,
	additionalContext: string,
): Promise<string> => {
	let body = '';

	if (orderId) {
		body += `\nBlocktank order ID: ${orderId}`;
	} else {
		//No specific order ID so add all of them
		const orders = getStore().blocktank.orders;
		if (orders.length > 0) {
			body += `\nBlocktank order IDs: ${orders.map((o) => o.id).join(', ')}`;
		}
	}

	if (additionalContext) {
		body += `\n${additionalContext}`;
	}

	return createSupportLink('Bitkit Support [Channel]', body);
};
