import fs from 'fs';
import path from 'path';

const LOCK_PATH = '/tmp/lock/';

export const bitcoinURL = 'http://polaruser:polarpass@127.0.0.1:43782';
export const electrumHost = '127.0.0.1';
export const electrumPort = 60001;

export const lndConfig = {
	server: 'localhost:10009',
	tls: `${__dirname}/../docker/lnd/tls.cert`,
	macaroonPath: `${__dirname}/../docker/lnd/data/chain/bitcoin/regtest/admin.macaroon`,
};

export const checkComplete = (name) => {
	if (!process.env.CI) {
		return false;
	}

	if (typeof name === 'string') {
		name = [name];
	}

	for (const n of name) {
		if (!fs.existsSync(path.join(LOCK_PATH, `lock-${n}`))) {
			return false;
		}
	}

	console.warn('skipping', name, 'as it previously passed on CI');
	return true;
};

export const markComplete = (name) => {
	if (!process.env.CI) {
		return;
	}

	fs.mkdirSync(LOCK_PATH, { recursive: true });
	fs.writeFileSync(path.join(LOCK_PATH, `lock-${name}`), '1');
};

export const sleep = (ms) => {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
};

export const isButtonEnabled = async (element) => {
	const attributes = await element.getAttributes();
	return attributes.label !== 'disabled';
};

export async function waitForElementAttribute(
	elementId,
	attribute,
	expectedValue = true,
	timeout = 10,
) {
	while (timeout >= 0) {
		const attributes = await element(by.id(elementId)).getAttributes();
		if (attributes[attribute] === expectedValue) {
			console.log(`${elementId} has attribute ${attribute}=${expectedValue}`);
			break;
		}

		console.log(
			`Waiting for ${elementId} to have attribute ${attribute}=${expectedValue}...`,
		);
		await sleep(1000);
		timeout--;
	}
}

export const completeOnboarding = async () => {
	await device.launchApp();

	// TOS and PP
	await waitFor(element(by.id('Check1'))).toBeVisible();

	await element(by.id('Check1')).tap();
	await element(by.id('Check2')).tap();
	await element(by.id('Continue')).tap();

	await waitFor(element(by.id('SkipIntro'))).toBeVisible();
	await element(by.id('SkipIntro')).tap();
	await waitFor(element(by.id('NewWallet'))).toBeVisible();
	await sleep(100); // wtf?
	await element(by.id('NewWallet')).tap();

	// wait for wallet to be created
	await waitFor(element(by.id('WalletOnboardingClose'))).toBeVisible();
	await sleep(1000); // take app some time to load

	// try for 3min before fail
	for (let i = 0; i < 180; i++) {
		await sleep(1000);
		try {
			await element(by.id('WalletOnboardingClose')).tap();
			await sleep(3000); // wait for redux-persist to save state
			return;
		} catch (_e) {}
	}

	throw new Error('Tapping "WalletOnboardingClose" timeout');
};

export const launchAndWait = async () => {
	await sleep(1000);
	await device.launchApp({
		newInstance: true,
		permissions: { faceid: 'YES', camera: 'YES' },
	});

	// wait for SuggestionsLabel to appear and be accessible
	await waitFor(element(by.id('SuggestionsLabel')))
		.toBeVisible()
		.withTimeout(300000); // 5 min
	for (let i = 0; i < 60; i++) {
		try {
			await element(by.id('SuggestionsLabel')).tap();
			await sleep(1000);
			break;
		} catch (_e) {}
	}
};

export const receiveOnchainFunds = async (rpc, amount = '0.001') => {
	await element(by.id('Receive')).tap();
	// Wait for animation
	await sleep(1000);
	// Get address from QR code
	let { label: wAddress } = await element(by.id('QRCode')).getAttributes();
	wAddress = wAddress.replace('bitcoin:', '');

	// Send and mine
	await rpc.sendToAddress(wAddress, amount);
	await rpc.generateToAddress(1, await rpc.getNewAddress());

	await waitFor(element(by.id('ReceivedTransaction')))
		.toBeVisible()
		.withTimeout(10000);
	await element(by.id('ReceivedTransaction')).swipe('down');
	await sleep(1000);
};

export const waitForPeerConnection = async (lnd, nodeId, maxRetries = 20) => {
	let retries = 0;

	while (retries < maxRetries) {
		await sleep(1000);
		const { peers } = await lnd.listPeers();
		if (peers?.some((p) => p.pubKey === nodeId)) {
			break;
		}
		retries++;
	}

	if (retries === maxRetries) {
		throw new Error('Peer not connected');
	}
};

export const waitForActiveChannel = async (lnd, nodeId, maxRetries = 20) => {
	let retries = 0;

	while (retries < maxRetries) {
		await sleep(1000);
		const { channels } = await lnd.listChannels({
			peer: Buffer.from(nodeId, 'hex'),
			activeOnly: true,
		});

		if (channels?.length > 0) {
			break;
		}

		retries++;
	}

	if (retries === maxRetries) {
		throw new Error('Channel not active');
	}
};

export const getSeed = async () => {
	await element(by.id('HeaderMenu')).tap();
	await element(by.id('DrawerSettings')).tap();
	await element(by.id('BackupSettings')).tap();
	await element(by.id('BackupWallet')).tap();
	// animation
	await sleep(200);
	await element(by.id('TapToReveal')).tap();

	// get the seed from SeedContaider
	const { label: seed } = await element(by.id('SeedContaider')).getAttributes();

	await element(by.id('SeedContaider')).swipe('down');
	// animation
	await sleep(200);
	await element(by.id('NavigationClose')).atIndex(0).tap();

	console.info({ seed });

	return seed;
};

export const restoreWallet = async (seed, passphrase) => {
	// make sure everything is saved to cloud storage
	// TODO: improve this
	await sleep(5000);

	await device.launchApp({ delete: true });

	await waitFor(element(by.id('Check1'))).toBeVisible();
	await element(by.id('Check1')).tap();
	await element(by.id('Check2')).tap();
	await element(by.id('Continue')).tap();
	await waitFor(element(by.id('SkipIntro'))).toBeVisible();
	await element(by.id('SkipIntro')).tap();
	await element(by.id('RestoreWallet')).tap();
	await element(by.id('MultipleDevices-button')).tap();
	await element(by.id('Word-0')).replaceText(seed);
	await element(by.id('WordIndex-4')).swipe('up');

	if (passphrase) {
		await element(by.id('AdvancedButton')).tap();
		await element(by.id('PassphraseInput')).typeText(passphrase);
		await element(by.id('PassphraseInput')).tapReturnKey();
	}

	await element(by.id('RestoreButton')).tap();

	await waitFor(element(by.id('GetStartedButton')))
		.toBeVisible()
		.withTimeout(300000); // 5 min
	await element(by.id('GetStartedButton')).tap();

	// wait for SuggestionsLabel to appear and be accessible
	for (let i = 0; i < 60; i++) {
		await sleep(200);
		try {
			await element(by.id('SuggestionsLabel')).tap();
			break;
		} catch (_e) {}
	}
};

export const waitForBackup = async () => {
	await element(by.id('HeaderMenu')).tap();
	await element(by.id('DrawerSettings')).tap();
	await element(by.id('BackupSettings')).tap();
	await waitFor(element(by.id('AllSynced')))
		.toBeVisible()
		.withTimeout(40000);
	await element(by.id('NavigationClose')).atIndex(0).tap();
};
