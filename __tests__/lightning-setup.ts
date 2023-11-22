import assert from 'node:assert';
import cloneDeep from 'lodash/cloneDeep';
import { IBtInfo } from '@synonymdev/blocktank-lsp-http-client';

import '../src/utils/i18n';
import { lnSetupSelector } from '../src/store/reselect/lightning';
import store from '../src/store';
import Store from '../src/store/types';
import { updateWallet } from '../src/store/actions/wallet';
import { createNewWallet } from '../src/utils/startup';

// const BTCUSD = 50000;

export const defaultBlocktankInfoShape: IBtInfo = {
	version: 2,
	nodes: [],
	options: {
		minChannelSizeSat: 10000,
		maxChannelSizeSat: 1980000, // 990 USD
		minExpiryWeeks: 1,
		maxExpiryWeeks: 12,
		minPaymentConfirmations: 0,
		minHighRiskPaymentConfirmations: 1,
		max0ConfClientBalanceSat: 0,
		maxClientBalanceSat: 990000, // 495 USD
	},
};

describe('lightning setup selector', () => {
	let s: Store;

	beforeAll(async () => {
		require('../nodejs-assets/nodejs-project/main.js');
		let res = await createNewWallet();
		if (res.isErr()) {
			throw res.error;
		}
		updateWallet({ selectedNetwork: 'bitcoinRegtest' });
		s = store.getState();
	});

	it('should throw if onchain balance is 0', () => {
		const state = cloneDeep(s);
		expect(() => lnSetupSelector(state, 0)).toThrow(TypeError);
	});

	it('should calculate correctly if onchain balance < minChannelSizeSat', () => {
		const state = cloneDeep(s);

		state.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;

		assert.deepEqual(lnSetupSelector(state, 0), {
			slider: { startValue: 0, endValue: 1000, maxValue: 800 },
			percentage: { spendings: 0, savings: 100 },
			spendableBalance: 800,
			btSpendingLimitBalanced: 856487,
			defaultClientBalance: 200,
		});

		assert.deepEqual(lnSetupSelector(state, 800), {
			slider: { startValue: 0, endValue: 1000, maxValue: 800 },
			percentage: { spendings: 80, savings: 20 },
			spendableBalance: 800,
			btSpendingLimitBalanced: 856487,
			defaultClientBalance: 200,
		});
	});

	it('should calculate percentage corectly', () => {
		const state = cloneDeep(s);
		// balance under maxChannelSizeSat
		state.wallet.wallets.wallet0.balance.bitcoinRegtest = 20000;

		expect(lnSetupSelector(state, 0)).toMatchObject({
			percentage: {
				savings: 100,
				spendings: 0,
			},
		});

		expect(lnSetupSelector(state, 10000)).toMatchObject({
			percentage: {
				savings: 50,
				spendings: 50,
			},
		});

		expect(lnSetupSelector(state, 16000)).toMatchObject({
			percentage: {
				savings: 20,
				spendings: 80,
			},
		});

		// balance over maxChannelSizeSat
		state.wallet.wallets.wallet0.balance.bitcoinRegtest = 2000000;

		expect(lnSetupSelector(state, 0)).toMatchObject({
			percentage: {
				savings: 100,
				spendings: 0,
			},
		});

		expect(lnSetupSelector(state, 10000)).toMatchObject({
			percentage: {
				savings: 50,
				spendings: 50,
			},
		});

		expect(lnSetupSelector(state, 16000)).toMatchObject({
			percentage: {
				savings: 20,
				spendings: 80,
			},
		});
	});
});
