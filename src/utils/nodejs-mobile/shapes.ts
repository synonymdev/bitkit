import { v4 as uuidv4 } from 'uuid';
import {
	ENodeJsMethod,
	INodeJsGetAddress,
	INodeJsGetPrivateKey,
	INodeJsGetScriptHash,
	INodeJsSetup,
} from './types';

export const DefaultNodeJsMethodsShape = {
	setup: (): INodeJsSetup => {
		return {
			id: uuidv4(),
			method: ENodeJsMethod.setup,
			data: {
				mnemonic: '',
				bip39Passphrase: '',
				selectedNetwork: undefined,
			},
		};
	},
	getScriptHash: (): INodeJsGetScriptHash => {
		return {
			id: uuidv4(),
			method: ENodeJsMethod.getScriptHash,
			data: {
				address: '',
				selectedNetwork: undefined,
			},
		};
	},
	getPrivateKey: (): INodeJsGetPrivateKey => {
		return {
			id: uuidv4(),
			method: ENodeJsMethod.getPrivateKey,
			data: {
				mnemonic: '',
				bip39Passphrase: '',
				path: '',
				selectedNetwork: undefined,
			},
		};
	},
	getAddress: (): INodeJsGetAddress => {
		return {
			id: uuidv4(),
			method: ENodeJsMethod.getAddress,
			data: {
				path: '',
				type: '',
				selectedNetwork: undefined,
			},
		};
	},
};
