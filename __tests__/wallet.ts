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
			'old found shock tenant merit tower foster chase sauce stool book enhance public key whip group retreat member cabin blanket sorry pole gym wink',
		);
		expect(res.value.tokens).toEqual(
			'inspire sick rule wild near rebuild pride tomato shell come drip reduce street steel warrior project radar sister day title spice execute evolve outside',
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
