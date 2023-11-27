import cloneDeep from 'lodash/cloneDeep';

import '../src/utils/i18n';
import { lnSetupSelector } from '../src/store/reselect/aggregations';
import store from '../src/store';
import Store from '../src/store/types';
import { updateWallet } from '../src/store/actions/wallet';
import { createNewWallet } from '../src/utils/startup';


// const blocktankInfo: IBtInfo = {
// 	version: 2,
// 	nodes: [],
// 	options: {
// 		minChannelSizeSat: 10,
// 		maxChannelSizeSat: 200,
// 		minExpiryWeeks: 1,
// 		maxExpiryWeeks: 12,
// 		minPaymentConfirmations: 0,
// 		minHighRiskPaymentConfirmations: 1,
// 		max0ConfClientBalanceSat: 0,
// 		maxClientBalanceSat: 100,
// 	},
// 	versions: {
// 		http: '0.0.0',
// 		btc: '0.0.0',
// 		ln2: '0.0.0',
// 	},
// };

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

	});

	it('should calculate btSpendingLimitBalanced correctly', () => {
		// max value is limited by btMaxChannelSizeSat / 2 - btMaxChannelSizeSat * DIFF
		const s1 = cloneDeep(s);
		s1.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
		s1.blocktank.info.options = {
			...s1.blocktank.info.options,
			minChannelSizeSat: 10,
			maxChannelSizeSat: 200,
			maxClientBalanceSat: 100,
		}

		expect(lnSetupSelector(s1, 0)).toMatchObject({
			slider: {
				startValue: 0,
				maxValue: 98,
				endValue: 1000,
			},
			btSpendingLimitBalanced: 98,
			spendableBalance: 800,
			defaultClientBalance: 98,
		});

		// max value is limited by btMaxClientBalanceSat
		const s2 = cloneDeep(s);
		s2.wallet.wallets.wallet0.balance.bitcoinRegtest = 1000;
		s2.blocktank.info.options = {
			...s2.blocktank.info.options,
			minChannelSizeSat: 10,
			maxChannelSizeSat: 200,
			maxClientBalanceSat: 50,
		}

		expect(lnSetupSelector(s2, 0)).toMatchObject({
			slider: {
				startValue: 0,
				maxValue: 50,
				endValue: 1000,
			},
			btSpendingLimitBalanced: 50,
			spendableBalance: 800,
			defaultClientBalance: 50,
		});

		// max value is limited by onchain balance
		const s3 = cloneDeep(s);
		s3.wallet.wallets.wallet0.balance.bitcoinRegtest = 50;
		s3.blocktank.info.options = {
			...s3.blocktank.info.options,
			minChannelSizeSat: 10,
			maxChannelSizeSat: 200,
			maxClientBalanceSat: 100,
		}

		expect(lnSetupSelector(s3, 0)).toMatchObject({
			slider: {
				startValue: 0,
				maxValue: 40,
				endValue: 50,
			},
			btSpendingLimitBalanced: 98,
			spendableBalance: 40,
			defaultClientBalance: 10,
		});
	});
});
