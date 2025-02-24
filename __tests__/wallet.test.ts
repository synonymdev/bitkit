import * as bip39 from 'bip39';
import { slashtagsPrimaryKey } from '../src/utils/wallet';

const mnemonic =
	'soon engine text scissors ready twelve paper raven merge skate north park broccoli acquire result broom ozone rigid huge taxi celery history sudden anchor';

describe('Wallet Methods', () => {
	it('Derive slashtags primay key from the Seed', async () => {
		const seed = await bip39.mnemonicToSeed(mnemonic);
		const slashtags = await slashtagsPrimaryKey(seed);
		expect(slashtags).toEqual(
			'be6d74439798f3217043a38de8c4da5a7e2b73714ace0811163105731ff0a066',
		);
	});
});
