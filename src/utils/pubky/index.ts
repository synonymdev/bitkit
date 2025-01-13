import { Result, err, ok } from '@synonymdev/result';
import { getSha256 } from 'beignet';
import { EAvailableNetwork } from '../networks.ts';
import { getPrivateKeyFromPath, getSelectedNetwork } from '../wallet';

export const getPubkySecretKey = async ({
	selectedNetwork = getSelectedNetwork(),
	version = 1,
}: {
	selectedNetwork?: EAvailableNetwork;
	version?: number;
} = {}): Promise<Result<string>> => {
	switch (version) {
		case 1: {
			// TODO: Update path/key derivation accordingly
			const privateKey = await getPrivateKeyFromPath({
				path: "m/184'/0'/0'/0/0",
				selectedNetwork,
			});
			if (privateKey.isErr()) {
				return err(privateKey.error.message);
			}
			const hash = getSha256(privateKey.value);
			return ok(hash);
		}
		default: {
			return err('Invalid version');
		}
	}
};
