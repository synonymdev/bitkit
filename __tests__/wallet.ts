import * as bip39 from 'bip39';

// Fix 'getDispatch is not a function'
import '../src/store/actions/ui';
import {
	deriveMnemonicPhrases,
	slashtagsPrimaryKey,
} from '../src/utils/wallet';
import { mnemonic } from './utils/dummy-wallet';

describe('Wallet Methods', () => {
	it('Derive multiple mnemonic phrases for lightning and tokens via the on-chain phrase.', async () => {
		const res = await deriveMnemonicPhrases(mnemonic);
		if (res.isErr()) {
			expect(res.error.message).toEqual('');
			return;
		}
		expect(res.value.onchain).toEqual(mnemonic);
		expect(res.value.lightning).toEqual(
			'lawn host tribe green enrich crime anxiety volume item pill soon steak hip mother orbit balcony avocado half scrap topic race near cool change',
		);
		expect(res.value.tokens).toEqual(
			'receive original tilt luxury autumn burden weapon mix bonus joke glow mobile west detect orient midnight slice control bargain height light clock argue oval',
		);
	});

	it('Derive slashtags primay key from the Seed', async () => {
		const seed = await bip39.mnemonicToSeed(mnemonic);
		const slashtags = await slashtagsPrimaryKey(seed);
		expect(slashtags).toEqual(
			'be6d74439798f3217043a38de8c4da5a7e2b73714ace0811163105731ff0a066',
		);
	});
});
