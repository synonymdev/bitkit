const rn_bridge = require('rn-bridge');
const { BitcoinActions } = require('./bitcoin-actions');

const bitcoinActions = new BitcoinActions();

/**
 * msg: {
 *     id: string;
 *     method: ENodeJsMethod;
 *     data: TNodeJsMethodsData;
 * }
 */
rn_bridge.channel.on('message', (msg) => {
	try {
		const parsedMsg = JSON.parse(msg);
		const method = parsedMsg.method;
		if (method in bitcoinActions) {
			bitcoinActions[method](parsedMsg).then((res) => {
				rn_bridge.channel.send(JSON.stringify(res));
			});
		} else {
			rn_bridge.channel.send(
				JSON.stringify({
					error: true,
					data: `Unknown method specified: ${method}`,
				}),
			);
		}
	} catch (e) {
		rn_bridge.channel.send(e);
	}
});
