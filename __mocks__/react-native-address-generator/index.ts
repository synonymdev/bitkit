import { ok } from "@synonymdev/result";

const AddressGeneratorMock = {
	getAddress: jest.fn(async (mnemonic, path, network) => {
		return ok({
			address: 'bcrt1q6rz28mcfaxtmd6v789l9rrlrusdprr9pz3cppk',
			path: path,
			publicKey: '02e7ab2537b5d49e970309aae06e9e49f36ce1c9febbd44ec8e0d1cca0b4f9c319',
		});
	}),

	getScriptHash: jest.fn(async (address, network) => {
		return ok('34dad6f450d0a21a999fc2158132141d4ba4c75e510e6b2e62cda4257af71d9a');
	}),

	getPrivateKey: jest.fn(async (mnemonic, path, network, passphrase = '') => {
		return ok('cTGhosGriPpuGA586jemcuH9pE9spwUmneMBmYYzrQEbY92DJrbo');
	}),
};

// jest.mock('react-native-address-generator', () => ({
// 	NativeModules: AddressGeneratorMock,
// 	Platform: {
// 		select: jest.fn(),
// 	},
// }));

module.exports = AddressGeneratorMock;
