import {
	ENodeJsMethods,
	INodeJsGenerateMnemonic,
	INodeJsGetAddress,
	INodeJsGetPrivateKey,
	INodeJsGetScriptHash,
	INodeJsSetup,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export const DefaultNodeJsMethodsShape = {
	setup: (): INodeJsSetup => {
		return {
			id: uuidv4(),
			method: ENodeJsMethods.setup,
			data: {
				mnemonic: '',
				bip39Passphrase: '',
				selectedNetwork: undefined,
			},
		};
	},
	generateMnemonic: (): INodeJsGenerateMnemonic => {
		return {
			id: uuidv4(),
			method: ENodeJsMethods.generateMnemonic,
			data: {
				strength: 256,
			},
		};
	},
	getScriptHash: (): INodeJsGetScriptHash => {
		return {
			id: uuidv4(),
			method: ENodeJsMethods.getScriptHash,
			data: {
				address: '',
				selectedNetwork: undefined,
			},
		};
	},
	getPrivateKey: (): INodeJsGetPrivateKey => {
		return {
			id: uuidv4(),
			method: ENodeJsMethods.getPrivateKey,
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
			method: ENodeJsMethods.getAddress,
			data: {
				path: '',
				type: '',
				selectedNetwork: undefined,
			},
		};
	},
};
