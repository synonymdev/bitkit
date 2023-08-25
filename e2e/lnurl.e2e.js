import BitcoinJsonRpc from 'bitcoin-json-rpc';
import createLndRpc from '@radar/lnrpc';
import LNURL from 'lnurl';

import {
	sleep,
	checkComplete,
	markComplete,
	launchAndWait,
	completeOnboarding,
	bitcoinURL,
} from './helpers';
import initWaitForElectrumToSync from '../__tests__/utils/wait-for-electrum';

const __DEV__ = process.env.DEV === 'true';

const tls = `${__dirname}/../docker/lnd/tls.cert`;
const macaroon = `${__dirname}/../docker/lnd/data/chain/bitcoin/regtest/admin.macaroon`;

d = checkComplete('lnurl-1') ? describe.skip : describe;

const waitForEvent = (lnurl, name) => {
	let timer;
	let resolve;
	let reject;
	return new Promise((res, rej) => {
		resolve = res;
		reject = rej;
		lnurl.once(`${name}:processed`, resolve);
		lnurl.once(`${name}:failed`, reject);
		timer = setTimeout(() => reject(new Error('waitForEvent timeout')), 30000);
	}).finally(() => {
		clearTimeout(timer);
		lnurl.removeListener(`${name}:processed`, resolve);
		lnurl.removeListener(`${name}:failed`, reject);
	});
};

d('LNURL', () => {
	let waitForElectrum;
	let lnurl;
	const rpc = new BitcoinJsonRpc(bitcoinURL);

	beforeAll(async () => {
		let balance = await rpc.getBalance();
		const address = await rpc.getNewAddress();

		while (balance < 10) {
			await rpc.generateToAddress(10, address);
			balance = await rpc.getBalance();
		}

		waitForElectrum = await initWaitForElectrumToSync(
			{ port: 60001, host: '127.0.0.1' },
			bitcoinURL,
		);

		lnurl = LNURL.createServer({
			host: 'localhost',
			port: 30001,
			lightning: {
				backend: 'lnd',
				config: { hostname: '127.0.0.1:8080', macaroon, cert: tls },
			},
			store: { config: { noWarning: true } },
		});

		await completeOnboarding();
	});

	afterAll(async () => {
		waitForElectrum?.close();
		lnurl.app.webServer.close();
		await sleep(1000);
	});

	beforeEach(async () => {
		await launchAndWait();
		await waitForElectrum();
	});

	it('Can process lnurl channel, withdraw, pay and login requests', async () => {
		// Test plan:
		// - connect to LND node`with lnurl-channel
		// - test lnurl-pay
		// - test lnrul-withdraw
		// - test lnurl-auth

		if (checkComplete('lnurl-1')) {
			return;
		}

		// get LDK Node id
		await element(by.id('Settings')).tap();
		if (!__DEV__) {
			await element(by.id('DevOptions')).multiTap(5); // enable dev mode
		}
		await element(by.id('AdvancedSettings')).tap();
		await element(by.id('LightningNodeInfo')).tap();
		await waitFor(element(by.id('LDKNodeID')))
			.toBeVisible()
			.withTimeout(60000);
		let { label: ldkNodeID } = await element(
			by.id('LDKNodeID'),
		).getAttributes();
		await element(by.id('NavigationClose')).tap();

		// send funds to LND node and open a channel
		const lnd = await createLndRpc({
			server: 'localhost:10009',
			macaroonPath: macaroon,
			tls,
		});
		const { address: lndAddress } = await lnd.newAddress();
		await rpc.sendToAddress(lndAddress, '1');
		await rpc.generateToAddress(1, await rpc.getNewAddress());
		await waitForElectrum();

		// test lnurl-channel
		const channelReq = await lnurl.generateNewUrl('channelRequest', {
			localAmt: 100001,
			pushAmt: 20001,
			private: 1,
		});

		await element(by.id('Scan')).tap();
		await element(by.id('ScanPrompt')).tap();
		await element(by.type('_UIAlertControllerTextField')).replaceText(
			channelReq.encoded,
		);
		await element(
			by.label('OK').and(by.type('_UIAlertControllerActionView')),
		).tap();
		const channelRequestPromise = waitForEvent(lnurl, 'channelRequest:action'); // init event listener
		await waitFor(element(by.id('ConnectButton')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('ConnectButton')).tap();
		await channelRequestPromise; // resove init listener

		// wait for peer to be connected
		let n = 0;
		while (true) {
			await sleep(1000);
			const { peers } = await lnd.listPeers();
			if (peers.some((p) => p.pubKey === ldkNodeID)) {
				break;
			}
			if (n++ === 19) {
				throw new Error('Peer not connected');
			}
		}

		await rpc.generateToAddress(6, await rpc.getNewAddress());
		await waitForElectrum();

		// wait for channel to be active
		n = 0;
		while (true) {
			await sleep(1000);
			const { channels } = await lnd.listChannels({
				peer: Buffer.from(ldkNodeID, 'hex'),
				activeOnly: true,
			});
			if (channels?.length > 0) {
				break;
			}
			if (n++ === 19) {
				throw new Error('Channel not active');
			}
		}

		await waitFor(element(by.id('LNURLChannelSuccess')))
			.toBeVisible()
			.withTimeout(30000);
		await element(by.id('LNURLChannelSuccess-button')).tap();

		// test lnurl-pay, with min !== max amount
		const payRequest1 = await lnurl.generateNewUrl('payRequest', {
			minSendable: 100000, // msats
			maxSendable: 200000, // msats
			metadata: '[["text/plain", "lnurl-node1"]]',
		});
		await element(by.id('Scan')).tap();
		await element(by.id('ScanPrompt')).tap();
		await element(by.type('_UIAlertControllerTextField')).replaceText(
			payRequest1.encoded,
		);
		await element(
			by.label('OK').and(by.type('_UIAlertControllerActionView')),
		).tap();

		await element(by.id('ContinueAmount')).tap();
		await element(by.id('GRAB')).swipe('right'); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();

		// test lnurl-pay, with min == max amount
		const payRequest2 = await lnurl.generateNewUrl('payRequest', {
			minSendable: 222000, // msats
			maxSendable: 222000, // msats
			metadata: '[["text/plain", "lnurl-node2"]]',
		});
		await element(by.id('Scan')).tap();
		await element(by.id('ScanPrompt')).tap();
		await element(by.type('_UIAlertControllerTextField')).replaceText(
			payRequest2.encoded,
		);
		await element(
			by.label('OK').and(by.type('_UIAlertControllerActionView')),
		).tap();
		await element(by.id('GRAB')).swipe('right'); // Swipe to confirm
		await waitFor(element(by.id('SendSuccess')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('Close')).tap();

		// test lnurl-withdraw, with min !== max amount
		const withdrawRequest1 = await lnurl.generateNewUrl('withdrawRequest', {
			minWithdrawable: 102000, // msats
			maxWithdrawable: 202000, // msats
			defaultDescription: 'lnurl-withdraw1',
		});
		await element(by.id('Scan')).tap();
		await element(by.id('ScanPrompt')).tap();
		await element(by.type('_UIAlertControllerTextField')).replaceText(
			withdrawRequest1.encoded,
		);
		await element(
			by.label('OK').and(by.type('_UIAlertControllerActionView')),
		).tap();
		await element(by.id('ContinueAmount')).tap();
		await element(by.id('WithdrawConfirmButton')).tap();
		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPrompt')).swipe('down');

		// test lnurl-withdraw, with min !== max amount
		const withdrawRequest2 = await lnurl.generateNewUrl('withdrawRequest', {
			minWithdrawable: 303000, // msats
			maxWithdrawable: 303000, // msats
			defaultDescription: 'lnurl-withdraw2',
		});
		await element(by.id('Scan')).tap();
		await element(by.id('ScanPrompt')).tap();
		await element(by.type('_UIAlertControllerTextField')).replaceText(
			withdrawRequest2.encoded,
		);
		await element(
			by.label('OK').and(by.type('_UIAlertControllerActionView')),
		).tap();
		await element(by.id('WithdrawConfirmButton')).tap();
		await waitFor(element(by.id('NewTxPrompt')))
			.toBeVisible()
			.withTimeout(10000);
		await element(by.id('NewTxPrompt')).swipe('down');

		// test lnurl-auth
		const loginRequest1 = await lnurl.generateNewUrl('login');
		await element(by.id('Scan')).tap();
		await element(by.id('ScanPrompt')).tap();
		await element(by.type('_UIAlertControllerTextField')).replaceText(
			loginRequest1.encoded,
		);

		const loginRequestPromise1 = new Promise((resolve) => {
			lnurl.once('login', resolve);
		});
		await element(
			by.label('OK').and(by.type('_UIAlertControllerActionView')),
		).tap();
		await loginRequestPromise1;

		markComplete('lnurl-1');
	});
});
