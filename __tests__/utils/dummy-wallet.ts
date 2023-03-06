import {
	defaultBitcoinTransactionData,
	getAddressIndexShape,
	objectTypeItems,
} from '../../src/store/shapes/wallet';
import {
	EAddressType,
	EPaymentType,
	IWallet,
} from '../../src/store/types/wallet';

test.skip('Workaround', () => {});

export const mnemonic =
	'soon engine text scissors ready twelve paper raven merge skate north park broccoli acquire result broom ozone rigid huge taxi celery history sudden anchor';

export const walletState: IWallet = {
	id: 'wallet0',
	name: '',
	type: 'default',
	lastUsedAddressIndex: getAddressIndexShape(),
	lastUsedChangeAddressIndex: getAddressIndexShape(),
	addresses: {
		bitcoin: {
			p2pkh: {
				e52461cbe17018ab6cc84174fedc1d95dbe21b6aba9c6637316101fa1f3b2e21: {
					index: 0,
					path: "m/44'/0'/0'/0/0",
					address: '1EGsGMJ6eMLKqkrJiXnPxvws83QZYKMWg3',
					scriptHash:
						'e52461cbe17018ab6cc84174fedc1d95dbe21b6aba9c6637316101fa1f3b2e21',
					publicKey:
						'030d10234b649efef13c85d322bc06b22703f717fb7d9edbb9b6c443e9ffc4f1b0',
				},
				'2cc344b0f405ba055c98e5696cb15a92fd0d2973b7d62e210143c10a4dbd2d23': {
					index: 1,
					path: "m/44'/0'/0'/0/1",
					address: '1LaGBmgRVGHYjD3aJvQoMfbmemb1A4KEZn',
					scriptHash:
						'2cc344b0f405ba055c98e5696cb15a92fd0d2973b7d62e210143c10a4dbd2d23',
					publicKey:
						'0374a19738117858ec301343a21405d9da47f5ef0a3dbed6e39c8f6f508a53f34b',
				},
			},
			p2sh: {
				db351e0b3a1cc5660673065138332ad579a38f6b870faaf96684fe395659f5da: {
					index: 0,
					path: "m/49'/0'/0'/0/0",
					address: '3LHfxaTFiEnQP4i7Ytcntxr9iMrY6fxC1c',
					scriptHash:
						'db351e0b3a1cc5660673065138332ad579a38f6b870faaf96684fe395659f5da',
					publicKey:
						'03073ec1f002c00f5f5c763f40651c78cef5ed6d4919f69646a96f822795f8617a',
				},
				b60df61a4de92cc8c3e09bee4767d3a0d1d2a59d19ed6700fe0a87499020eca7: {
					index: 1,
					path: "m/49'/0'/0'/0/1",
					address: '36Y5AVhPo3yyCqAKN3spCAvJmpwSPqzEHh',
					scriptHash:
						'b60df61a4de92cc8c3e09bee4767d3a0d1d2a59d19ed6700fe0a87499020eca7',
					publicKey:
						'03332e1b2ea445a739a9d2380068d1ff089077f081a5548595015a13879a6447b4',
				},
			},
			p2wpkh: {
				'107c61ca18fd13fc44317328859caac9e842022710d4c9bb500730196784a979': {
					index: 0,
					path: "m/84'/0'/0'/0/0",
					address: 'bc1qtfj25df4v4nthatcrav8j5n59y8qjurarg36ss',
					scriptHash:
						'107c61ca18fd13fc44317328859caac9e842022710d4c9bb500730196784a979',
					publicKey:
						'03cd4bb5a7b215224cbeae45ffa739fcb5b087f5a92278dd1791a4865d0a7e8363',
				},
				'5741d24048f83f33cf3e3672f0ef626db0f18dce1efd8d1e99b07f5b5f96723b': {
					index: 1,
					path: "m/84'/0'/0'/0/1",
					address: 'bc1qvnm745vph2fh8j084mf3tct2jz6dqmhux5a3sq',
					scriptHash:
						'5741d24048f83f33cf3e3672f0ef626db0f18dce1efd8d1e99b07f5b5f96723b',
					publicKey:
						'021af2ebcef3a898c221b9a02390625b38f385e7dbe3ae73589dd4ebf6bb91cb65',
				},
			},
		},
		bitcoinTestnet: {
			p2pkh: {
				'1b99019adb6528b080629f76598076e8a2ee8c8e1f08fa328c8cb46b1685d66f': {
					index: 0,
					path: "m/44'/1'/0'/0/0",
					address: 'mm9VmJLLTHNDp2TkmTB1axPPp93Qef785E',
					scriptHash:
						'1b99019adb6528b080629f76598076e8a2ee8c8e1f08fa328c8cb46b1685d66f',
					publicKey:
						'02c6118f1699f077a066f3333e1b636b4f92df0b0888fcbdee3b397d7088e7542c',
				},
				b4387ade95fedf66c9b8bb1e5654c5d05bb41521c360471040abd9ac56eabcff: {
					index: 1,
					path: "m/44'/1'/0'/0/1",
					address: 'mt6D3Q4KysBjLFtRJqxaZ56w2n425c4m2q',
					scriptHash:
						'b4387ade95fedf66c9b8bb1e5654c5d05bb41521c360471040abd9ac56eabcff',
					publicKey:
						'0312539606bc665616815613f67a8632c3b899cd3d801967c369469719e968c2fe',
				},
			},
			p2sh: {
				'785588dec281ced6c846ce71ce104fd84f7e76bc27c5b0944ab9e59907e347b0': {
					index: 0,
					path: "m/49'/1'/0'/0/0",
					address: '2MyfXatbfg2yJAPDBqDtGHYeYPkPPkbKJT7',
					scriptHash:
						'785588dec281ced6c846ce71ce104fd84f7e76bc27c5b0944ab9e59907e347b0',
					publicKey:
						'03fb4da6baa6f132bcd61519928a33a9bdb998e0860ea6243a5b4ec1a4d16ea924',
				},
				e1282e29728c142c722362f12fae54b3f9aa41c9661edcb8aea1c1037ed03928: {
					index: 1,
					path: "m/49'/1'/0'/0/1",
					address: '2N5pXmvyTtuiGBzepCCCt9fzKmQjh2r9iHn',
					scriptHash:
						'e1282e29728c142c722362f12fae54b3f9aa41c9661edcb8aea1c1037ed03928',
					publicKey:
						'027a0a7bd100713dd77c16d2dd6f3aef7eba2a097d0476401d9d526602ac4a7b9d',
				},
			},
			p2wpkh: {
				'8e94db4e01581378ca5ae3c495bafc07bc505bd901432a7847c69a407d63696d': {
					index: 0,
					path: "m/84'/1'/0'/0/0",
					address: 'tb1qkraf7a4fw3nu5gl5594e4zrfmqwefcfvuvpeqc',
					scriptHash:
						'8e94db4e01581378ca5ae3c495bafc07bc505bd901432a7847c69a407d63696d',
					publicKey:
						'033e3cf8b26986d5e865537944c15d7c88648e0f7fa5d73b32ed6a65ca444dc54c',
				},
				c4e6da4046570147f0780b8db2eedc6bffebf84da89ab0486e88852a4481b074: {
					index: 1,
					path: "m/84'/1'/0'/0/1",
					address: 'tb1qc44u6xmm5a89jz9u97wydjxh6spp5sr0lu398s',
					scriptHash:
						'c4e6da4046570147f0780b8db2eedc6bffebf84da89ab0486e88852a4481b074',
					publicKey:
						'032e87df36244a39252d5dda35559c9be603c5f81b75105b5d2587746cf845016b',
				},
				ec1711190e7525c3f01df2d20a0cb5fd6e7697776625c7e675d4529ac4b2e7ae: {
					index: 2,
					path: "m/84'/1'/0'/0/2",
					address: 'tb1qnwvt9sj397tcnkv3p2gmgv2ty99ntxpjwydncv',
					scriptHash:
						'ec1711190e7525c3f01df2d20a0cb5fd6e7697776625c7e675d4529ac4b2e7ae',
					publicKey:
						'0318cb16a8e659f378002e75abe93f064c4ebcd62576bc15019281b635f96840a8',
				},
				'9a426c2e93f29ddf39b71b3d0b39f65748a74b640315bec778418c65fea4980e': {
					index: 3,
					path: "m/84'/1'/0'/0/3",
					address: 'tb1ql7s3zpkhkufqaxa7m56lmavj0h4xwnlthuvscs',
					scriptHash:
						'9a426c2e93f29ddf39b71b3d0b39f65748a74b640315bec778418c65fea4980e',
					publicKey:
						'02c4c5fe83d11a1c65a44c6077b2c9e965ef08dced8afaa234686a99410035b1b1',
				},
				'6002e0c5e089515fcafcbf2d107449bdde0f49a05f40b0df24b3aaa2ab4250ae': {
					index: 4,
					path: "m/84'/1'/0'/0/4",
					address: 'tb1qyww0pawlrxdpe7pyva34nnn7a4lp7ucgs79hpr',
					scriptHash:
						'6002e0c5e089515fcafcbf2d107449bdde0f49a05f40b0df24b3aaa2ab4250ae',
					publicKey:
						'03a01fc1273054e8eb75b66a61331089b3c107cdd2b5a6958e914c095fef5d7103',
				},
				bdd3a5882878ffa34d579c6c5d211a4cddf216f00ffb3194b57d5ce450082fbf: {
					index: 5,
					path: "m/84'/1'/0'/0/5",
					address: 'tb1qafnqdzwmjw538eyfe7hrxnh68flgdech7g329t',
					scriptHash:
						'bdd3a5882878ffa34d579c6c5d211a4cddf216f00ffb3194b57d5ce450082fbf',
					publicKey:
						'0240384983aa3a888d73f8d1522438a3223dde785565bf51e665548793cb93db19',
				},
			},
		},
		bitcoinRegtest: {
			p2pkh: {
				e52461cbe17018ab6cc84174fedc1d95dbe21b6aba9c6637316101fa1f3b2e21: {
					index: 0,
					path: "m/44'/0'/0'/0/0",
					address: '1EGsGMJ6eMLKqkrJiXnPxvws83QZYKMWg3',
					scriptHash:
						'e52461cbe17018ab6cc84174fedc1d95dbe21b6aba9c6637316101fa1f3b2e21',
					publicKey:
						'030d10234b649efef13c85d322bc06b22703f717fb7d9edbb9b6c443e9ffc4f1b0',
				},
				'2cc344b0f405ba055c98e5696cb15a92fd0d2973b7d62e210143c10a4dbd2d23': {
					index: 1,
					path: "m/44'/0'/0'/0/1",
					address: '1LaGBmgRVGHYjD3aJvQoMfbmemb1A4KEZn',
					scriptHash:
						'2cc344b0f405ba055c98e5696cb15a92fd0d2973b7d62e210143c10a4dbd2d23',
					publicKey:
						'0374a19738117858ec301343a21405d9da47f5ef0a3dbed6e39c8f6f508a53f34b',
				},
			},
			p2sh: {
				db351e0b3a1cc5660673065138332ad579a38f6b870faaf96684fe395659f5da: {
					index: 0,
					path: "m/49'/0'/0'/0/0",
					address: '3LHfxaTFiEnQP4i7Ytcntxr9iMrY6fxC1c',
					scriptHash:
						'db351e0b3a1cc5660673065138332ad579a38f6b870faaf96684fe395659f5da',
					publicKey:
						'03073ec1f002c00f5f5c763f40651c78cef5ed6d4919f69646a96f822795f8617a',
				},
				b60df61a4de92cc8c3e09bee4767d3a0d1d2a59d19ed6700fe0a87499020eca7: {
					index: 1,
					path: "m/49'/0'/0'/0/1",
					address: '36Y5AVhPo3yyCqAKN3spCAvJmpwSPqzEHh',
					scriptHash:
						'b60df61a4de92cc8c3e09bee4767d3a0d1d2a59d19ed6700fe0a87499020eca7',
					publicKey:
						'03332e1b2ea445a739a9d2380068d1ff089077f081a5548595015a13879a6447b4',
				},
			},
			p2wpkh: {
				'107c61ca18fd13fc44317328859caac9e842022710d4c9bb500730196784a979': {
					index: 0,
					path: "m/84'/0'/0'/0/0",
					address: 'bc1qtfj25df4v4nthatcrav8j5n59y8qjurarg36ss',
					scriptHash:
						'107c61ca18fd13fc44317328859caac9e842022710d4c9bb500730196784a979',
					publicKey:
						'03cd4bb5a7b215224cbeae45ffa739fcb5b087f5a92278dd1791a4865d0a7e8363',
				},
				'5741d24048f83f33cf3e3672f0ef626db0f18dce1efd8d1e99b07f5b5f96723b': {
					index: 1,
					path: "m/84'/0'/0'/0/1",
					address: 'bc1qvnm745vph2fh8j084mf3tct2jz6dqmhux5a3sq',
					scriptHash:
						'5741d24048f83f33cf3e3672f0ef626db0f18dce1efd8d1e99b07f5b5f96723b',
					publicKey:
						'021af2ebcef3a898c221b9a02390625b38f385e7dbe3ae73589dd4ebf6bb91cb65',
				},
			},
		},
		timestamp: null,
	},
	addressIndex: {
		bitcoin: {
			p2pkh: {
				index: 0,
				path: "m/44'/0'/0'/0/0",
				address: '1EGsGMJ6eMLKqkrJiXnPxvws83QZYKMWg3',
				scriptHash:
					'e52461cbe17018ab6cc84174fedc1d95dbe21b6aba9c6637316101fa1f3b2e21',
				publicKey:
					'030d10234b649efef13c85d322bc06b22703f717fb7d9edbb9b6c443e9ffc4f1b0',
			},
			p2sh: {
				index: 0,
				path: "m/49'/0'/0'/0/0",
				address: '3LHfxaTFiEnQP4i7Ytcntxr9iMrY6fxC1c',
				scriptHash:
					'db351e0b3a1cc5660673065138332ad579a38f6b870faaf96684fe395659f5da',
				publicKey:
					'03073ec1f002c00f5f5c763f40651c78cef5ed6d4919f69646a96f822795f8617a',
			},
			p2wpkh: {
				index: 0,
				path: "m/84'/0'/0'/0/0",
				address: 'bc1qtfj25df4v4nthatcrav8j5n59y8qjurarg36ss',
				scriptHash:
					'107c61ca18fd13fc44317328859caac9e842022710d4c9bb500730196784a979',
				publicKey:
					'03cd4bb5a7b215224cbeae45ffa739fcb5b087f5a92278dd1791a4865d0a7e8363',
			},
		},
		bitcoinTestnet: {
			p2pkh: {
				index: 0,
				path: "m/44'/1'/0'/0/0",
				address: 'mm9VmJLLTHNDp2TkmTB1axPPp93Qef785E',
				scriptHash:
					'1b99019adb6528b080629f76598076e8a2ee8c8e1f08fa328c8cb46b1685d66f',
				publicKey:
					'02c6118f1699f077a066f3333e1b636b4f92df0b0888fcbdee3b397d7088e7542c',
			},
			p2sh: {
				index: 0,
				path: "m/49'/1'/0'/0/0",
				address: '2MyfXatbfg2yJAPDBqDtGHYeYPkPPkbKJT7',
				scriptHash:
					'785588dec281ced6c846ce71ce104fd84f7e76bc27c5b0944ab9e59907e347b0',
				publicKey:
					'03fb4da6baa6f132bcd61519928a33a9bdb998e0860ea6243a5b4ec1a4d16ea924',
			},
			p2wpkh: {
				index: 3,
				path: "m/84'/1'/0'/0/3",
				address: 'tb1ql7s3zpkhkufqaxa7m56lmavj0h4xwnlthuvscs',
				scriptHash:
					'9a426c2e93f29ddf39b71b3d0b39f65748a74b640315bec778418c65fea4980e',
				publicKey:
					'02c4c5fe83d11a1c65a44c6077b2c9e965ef08dced8afaa234686a99410035b1b1',
			},
		},
		bitcoinRegtest: {
			p2pkh: {
				index: 0,
				path: "m/44'/0'/0'/0/0",
				address: '1EGsGMJ6eMLKqkrJiXnPxvws83QZYKMWg3',
				scriptHash:
					'e52461cbe17018ab6cc84174fedc1d95dbe21b6aba9c6637316101fa1f3b2e21',
				publicKey:
					'030d10234b649efef13c85d322bc06b22703f717fb7d9edbb9b6c443e9ffc4f1b0',
			},
			p2sh: {
				index: 0,
				path: "m/49'/0'/0'/0/0",
				address: '3LHfxaTFiEnQP4i7Ytcntxr9iMrY6fxC1c',
				scriptHash:
					'db351e0b3a1cc5660673065138332ad579a38f6b870faaf96684fe395659f5da',
				publicKey:
					'03073ec1f002c00f5f5c763f40651c78cef5ed6d4919f69646a96f822795f8617a',
			},
			p2wpkh: {
				index: 0,
				path: "m/84'/0'/0'/0/0",
				address: 'bc1qtfj25df4v4nthatcrav8j5n59y8qjurarg36ss',
				scriptHash:
					'107c61ca18fd13fc44317328859caac9e842022710d4c9bb500730196784a979',
				publicKey:
					'03cd4bb5a7b215224cbeae45ffa739fcb5b087f5a92278dd1791a4865d0a7e8363',
			},
		},
		timestamp: null,
	},
	changeAddresses: {
		bitcoin: {
			p2pkh: {
				d1bf96f6698a2f3af000d17174accc00dc7892fe95d9964610b0773d112046fc: {
					index: 0,
					path: "m/44'/0'/0'/1/0",
					address: '1PKKgu6PFzm54oDT6kzZRGyA5sjAW4YexN',
					scriptHash:
						'd1bf96f6698a2f3af000d17174accc00dc7892fe95d9964610b0773d112046fc',
					publicKey:
						'03ff54c3d4698ab67d6a18fcc3ebec3d06b79dd435721f9ef7dec75345bba2e9e8',
				},
				f469ebc3e19d876e3b93e7e2bc732e8ac3fdff39b35421be94218adcc5c5703c: {
					index: 1,
					path: "m/44'/0'/0'/1/1",
					address: '1GoQeiaVqXMNACA1q3dMEqxoCZmdfVCSgX',
					scriptHash:
						'f469ebc3e19d876e3b93e7e2bc732e8ac3fdff39b35421be94218adcc5c5703c',
					publicKey:
						'030549dc9e9aef70013c21c8ad073898e01511cddbe9bc247b1545abf26da8ea4b',
				},
			},
			p2sh: {
				'166fc45cdff1f92bb0f10ce8340d8a7275343a662acc975c56c5d343c3920acd': {
					index: 0,
					path: "m/49'/0'/0'/1/0",
					address: '37xwe1wNuwR5iSAhtm81hyw3NmSNCD1687',
					scriptHash:
						'166fc45cdff1f92bb0f10ce8340d8a7275343a662acc975c56c5d343c3920acd',
					publicKey:
						'028b74ed0a468cae26c86b03ce9e06f74a4b7879dc223ef12ce514b27bcf52a814',
				},
				d42337dc909075e24cdc0609cb8d5c43b6d0ebb0aa3efba44c06b6000b114164: {
					index: 1,
					path: "m/49'/0'/0'/1/1",
					address: '32BWYZYw4nFsR2vhewnduvM3M9bchA2N9g',
					scriptHash:
						'd42337dc909075e24cdc0609cb8d5c43b6d0ebb0aa3efba44c06b6000b114164',
					publicKey:
						'029f0d1d2079df0ce6b703cd5e9da44600fe54dcde98e38eec23b211ebc5ac9d02',
				},
			},
			p2wpkh: {
				d69df0a25efd2a3512cdedacf3f100c6186d82df1272ddd4d9603bbe0a5c88b0: {
					index: 0,
					path: "m/84'/0'/0'/1/0",
					address: 'bc1q5vpfcqqk8a853jj66q72chrpgtlupp5a5s70jc',
					scriptHash:
						'd69df0a25efd2a3512cdedacf3f100c6186d82df1272ddd4d9603bbe0a5c88b0',
					publicKey:
						'03d2a7d31a2ea9aee7d719048e36393bd66dc6257bab8c0227332b77c675526378',
				},
				adc9ddba88e355596062e1f85614f6d3b065f024d38f3037677e8ca3580b0cd9: {
					index: 1,
					path: "m/84'/0'/0'/1/1",
					address: 'bc1qxwz0fkpjxrdc43dl40q8s289y9j6wunv432tsz',
					scriptHash:
						'adc9ddba88e355596062e1f85614f6d3b065f024d38f3037677e8ca3580b0cd9',
					publicKey:
						'0384439110dd369ab838502c5e3d5cec9d1eacdcbb8c2733714842a58789ac8652',
				},
			},
		},
		bitcoinTestnet: {
			p2pkh: {
				a2a6bad026f3f2bcc13df1739075f76ae87e150e9ad6f8bb97881783a776a585: {
					index: 0,
					path: "m/44'/1'/0'/1/0",
					address: 'moSGE4fNhiuyTf5QanMCkdKeaaRVh2QDiL',
					scriptHash:
						'a2a6bad026f3f2bcc13df1739075f76ae87e150e9ad6f8bb97881783a776a585',
					publicKey:
						'02394162c3fdaf3703e735a330a03d25ce97cf21cf54a9484e43de4cd2a1cff9d5',
				},
				d97a0639edb905c62a75618abb36f7b07c4e4cb743cfc51d83a2ad19b08def05: {
					index: 1,
					path: "m/44'/1'/0'/1/1",
					address: 'mto8wSjwe8PS4JrPQBBwba6iGtQRKWdMiD',
					scriptHash:
						'd97a0639edb905c62a75618abb36f7b07c4e4cb743cfc51d83a2ad19b08def05',
					publicKey:
						'029f7cfe9673487e65879c2e61708c086d2ea46fc4ab6714b27cd6d29955194b1c',
				},
			},
			p2sh: {
				db49dcf274dd3f373bad7a6219dae46294c21491bf836fce05bf14a951f65d54: {
					index: 0,
					path: "m/49'/1'/0'/1/0",
					address: '2N8K56BSepHFVk4XST61NJjSMwcdC94eDmT',
					scriptHash:
						'db49dcf274dd3f373bad7a6219dae46294c21491bf836fce05bf14a951f65d54',
					publicKey:
						'0313e5be2a537cca9677df958d1f5728da171d9a192f0efcc18d2b4c63e746a67e',
				},
				'266a694746f3fb7e8254cad09f0796d94eb2537ebc5fb10aa7d7b9a4b49400cc': {
					index: 1,
					path: "m/49'/1'/0'/1/1",
					address: '2N1PB6WijqRGLACZNxatBnbP1joG1Rx7CeZ',
					scriptHash:
						'266a694746f3fb7e8254cad09f0796d94eb2537ebc5fb10aa7d7b9a4b49400cc',
					publicKey:
						'0296d1c118cb53e7c24ce3cabcab28a5961a4ca48f7c735766698187c0115dfaec',
				},
			},
			p2wpkh: {
				'123ee0aabf117c2ebeb0fe9e7514c0ec356c72cc37d5ac491574545a28629bdc': {
					index: 0,
					path: "m/84'/1'/0'/1/0",
					address: 'tb1qavg2wpnkucp8p0tg9mug8aa6m373peqvjpau3j',
					scriptHash:
						'123ee0aabf117c2ebeb0fe9e7514c0ec356c72cc37d5ac491574545a28629bdc',
					publicKey:
						'020776deb585463432173ff1d48b84c9271bf3c99b8fc6e2f5bb3c0741aa1ce27c',
				},
				'79ec3588ca4e6709c6be362c90b6973882a6d65dd6aa4650d3afbefbde01b45b': {
					index: 1,
					path: "m/84'/1'/0'/1/1",
					address: 'tb1q6tcs8kkle36qywe0h54w83h0qxcw7nvqg99an9',
					scriptHash:
						'79ec3588ca4e6709c6be362c90b6973882a6d65dd6aa4650d3afbefbde01b45b',
					publicKey:
						'03bb427af22bf3dd69b3a557522b49feb2f00c6e51d549ac32810e439e25e8c1b0',
				},
				'373cf777ba9bab3500e5d7b49d542cb5b2ef8eada4c77c142059ae2f1b0aa9a9': {
					index: 2,
					path: "m/84'/1'/0'/1/2",
					address: 'tb1qr3w9myz6qfmv4s688afnahwuxjwqtxjrl3vlk2',
					scriptHash:
						'373cf777ba9bab3500e5d7b49d542cb5b2ef8eada4c77c142059ae2f1b0aa9a9',
					publicKey:
						'02bb6083f2571ecd26f68edeae341c0700463349a84b2044c271e061e813e0cd03',
				},
				a2b7ecfa46160cfbc11fb3f308d89af8563d2015056e012f154ac80acc714147: {
					index: 3,
					path: "m/84'/1'/0'/1/3",
					address: 'tb1qv6dfxg6ps6fms82ycxw60v070ygmy9pfscr6my',
					scriptHash:
						'a2b7ecfa46160cfbc11fb3f308d89af8563d2015056e012f154ac80acc714147',
					publicKey:
						'036b0c48598b2fae77e3d3084758ec1f67d444e98892ed9c087e9926d5a845ae64',
				},
				'4bb583646404a18942a7b60b32af1d04825b627de390ff44d90ca53362e487ab': {
					index: 4,
					path: "m/84'/1'/0'/1/4",
					address: 'tb1qhvjvxx2w2cfvr0c57hyr0kywtwm93f04gmfu58',
					scriptHash:
						'4bb583646404a18942a7b60b32af1d04825b627de390ff44d90ca53362e487ab',
					publicKey:
						'03cf98d0183e4d73f70e86c007e2932745ca5c412a87e8b0bff52b1b56b98372bb',
				},
				'17d31a9eafaa768bea5102d326711adaa4aae702bbd74768c8063b93b88a89ef': {
					index: 5,
					path: "m/84'/1'/0'/1/5",
					address: 'tb1qqyzv0cvvcfnl5y625wtwmfk0xhdmlsfne8vz0q',
					scriptHash:
						'17d31a9eafaa768bea5102d326711adaa4aae702bbd74768c8063b93b88a89ef',
					publicKey:
						'03cf28854d93b8af486ea4af4d1dcd147cfca20d15139b3260ab509f68c2038c11',
				},
			},
		},
		bitcoinRegtest: {
			p2pkh: {},
			p2sh: {},
			p2wpkh: {},
		},
		timestamp: null,
	},
	changeAddressIndex: {
		bitcoin: {
			p2pkh: {
				index: 0,
				path: "m/44'/0'/0'/1/0",
				address: '1PKKgu6PFzm54oDT6kzZRGyA5sjAW4YexN',
				scriptHash:
					'd1bf96f6698a2f3af000d17174accc00dc7892fe95d9964610b0773d112046fc',
				publicKey:
					'03ff54c3d4698ab67d6a18fcc3ebec3d06b79dd435721f9ef7dec75345bba2e9e8',
			},
			p2sh: {
				index: 0,
				path: "m/49'/0'/0'/1/0",
				address: '37xwe1wNuwR5iSAhtm81hyw3NmSNCD1687',
				scriptHash:
					'166fc45cdff1f92bb0f10ce8340d8a7275343a662acc975c56c5d343c3920acd',
				publicKey:
					'028b74ed0a468cae26c86b03ce9e06f74a4b7879dc223ef12ce514b27bcf52a814',
			},
			p2wpkh: {
				index: 0,
				path: "m/84'/0'/0'/1/0",
				address: 'bc1q5vpfcqqk8a853jj66q72chrpgtlupp5a5s70jc',
				scriptHash:
					'd69df0a25efd2a3512cdedacf3f100c6186d82df1272ddd4d9603bbe0a5c88b0',
				publicKey:
					'03d2a7d31a2ea9aee7d719048e36393bd66dc6257bab8c0227332b77c675526378',
			},
		},
		bitcoinTestnet: {
			p2pkh: {
				index: 0,
				path: "m/44'/1'/0'/1/0",
				address: 'moSGE4fNhiuyTf5QanMCkdKeaaRVh2QDiL',
				scriptHash:
					'a2a6bad026f3f2bcc13df1739075f76ae87e150e9ad6f8bb97881783a776a585',
				publicKey:
					'02394162c3fdaf3703e735a330a03d25ce97cf21cf54a9484e43de4cd2a1cff9d5',
			},
			p2sh: {
				index: 0,
				path: "m/49'/1'/0'/1/0",
				address: '2N8K56BSepHFVk4XST61NJjSMwcdC94eDmT',
				scriptHash:
					'db49dcf274dd3f373bad7a6219dae46294c21491bf836fce05bf14a951f65d54',
				publicKey:
					'0313e5be2a537cca9677df958d1f5728da171d9a192f0efcc18d2b4c63e746a67e',
			},
			p2wpkh: {
				index: 3,
				path: "m/84'/1'/0'/1/3",
				address: 'tb1qv6dfxg6ps6fms82ycxw60v070ygmy9pfscr6my',
				scriptHash:
					'a2b7ecfa46160cfbc11fb3f308d89af8563d2015056e012f154ac80acc714147',
				publicKey:
					'036b0c48598b2fae77e3d3084758ec1f67d444e98892ed9c087e9926d5a845ae64',
			},
		},
		bitcoinRegtest: {
			p2pkh: {
				scriptHash: '',
				publicKey: '',
				address: '',
				index: -1,
				path: '',
			},
			p2sh: {
				scriptHash: '',
				publicKey: '',
				address: '',
				index: -1,
				path: '',
			},
			p2wpkh: {
				address: 'bcrt1qzettvpw4uhd9uzj5x5fwdmjf9srxkqpp4lxgd4',
				scriptHash:
					'05a7da8399b1fffe8f5b1c93573aa5f1fac54110851e9a016444b1c4320ec8aa',
				publicKey:
					'03ee8ca6ab69fa3960c9e3c11f948c065c8aa155b25725fa009b69ffcd0527f7e7',
				index: 0,
				path: "m/84'/0'/0'/0/0",
			},
		},
		timestamp: null,
	},
	utxos: {
		bitcoin: [],
		bitcoinTestnet: [
			{
				index: 2,
				path: "m/84'/1'/0'/0/2",
				address: 'tb1qnwvt9sj397tcnkv3p2gmgv2ty99ntxpjwydncv',
				scriptHash:
					'ec1711190e7525c3f01df2d20a0cb5fd6e7697776625c7e675d4529ac4b2e7ae',
				tx_hash:
					'71c61ef6dd1af0a06cb6040459c3b7b2cbe2ab8ec9f4d8abd73eba4931ab0e0c',
				tx_pos: 0,
				height: 2064116,
				value: 123456,
			},
			{
				index: 2,
				path: "m/84'/1'/0'/1/2",
				address: 'tb1qr3w9myz6qfmv4s688afnahwuxjwqtxjrl3vlk2',
				scriptHash:
					'373cf777ba9bab3500e5d7b49d542cb5b2ef8eada4c77c142059ae2f1b0aa9a9',
				tx_hash:
					'206962f8dcefbaf5a05c1dcc6cd0c214420c6be4e0e634bf71dbca518884bd51',
				tx_pos: 0,
				height: 1975242,
				value: 4750,
			},
		],
		bitcoinRegtest: [],
		timestamp: null,
	},
	transactions: {
		bitcoin: {},
		bitcoinTestnet: {
			'206962f8dcefbaf5a05c1dcc6cd0c214420c6be4e0e634bf71dbca518884bd51': {
				address: 'tb1q6tcs8kkle36qywe0h54w83h0qxcw7nvqg99an9',
				height: 1975242,
				scriptHash:
					'79ec3588ca4e6709c6be362c90b6973882a6d65dd6aa4650d3afbefbde01b45b',
				totalInputValue: 0.00130439,
				matchedInputValue: 0.00130439,
				totalOutputValue: 0.00130189,
				matchedOutputValue: 0,
				fee: 0.0000025,
				satsPerByte: 1,
				type: EPaymentType.sent,
				value: -0.00130439,
				txid: '206962f8dcefbaf5a05c1dcc6cd0c214420c6be4e0e634bf71dbca518884bd51',
				messages: [],
				timestamp: 1620919862000,
			},
			'6927ef1dbc7afd90dde0969e8455411e8bf30303e5da470de2a2b37b8337e7d5': {
				address: 'tb1qkraf7a4fw3nu5gl5594e4zrfmqwefcfvuvpeqc',
				height: 1974327,
				scriptHash:
					'8e94db4e01581378ca5ae3c495bafc07bc505bd901432a7847c69a407d63696d',
				totalInputValue: 6.02796235,
				matchedInputValue: 0,
				totalOutputValue: 6.027960129999999,
				matchedOutputValue: 0.0001,
				fee: 0.00000222,
				satsPerByte: 1,
				type: EPaymentType.received,
				value: 0.0001,
				txid: '6927ef1dbc7afd90dde0969e8455411e8bf30303e5da470de2a2b37b8337e7d5',
				messages: [],
				timestamp: 1620127029000,
			},
			'83c9769fcf970ae8806b18549b18d7ad05e1f7c7e546bb4e355c638262977da2': {
				address: 'tb1qc44u6xmm5a89jz9u97wydjxh6spp5sr0lu398s',
				height: 1974523,
				scriptHash:
					'c4e6da4046570147f0780b8db2eedc6bffebf84da89ab0486e88852a4481b074',
				totalInputValue: 6.02585791,
				matchedInputValue: 0,
				totalOutputValue: 6.02585569,
				matchedOutputValue: 0.00123456,
				fee: 0.00000222,
				satsPerByte: 1,
				type: EPaymentType.received,
				value: 0.00123456,
				txid: '83c9769fcf970ae8806b18549b18d7ad05e1f7c7e546bb4e355c638262977da2',
				messages: [],
				timestamp: 1620302817000,
			},
			ac3f19029332cbd2f2d01544dea8e0d98dd41f3082b05ee24aa84f4f6168e929: {
				address: 'tb1qkraf7a4fw3nu5gl5594e4zrfmqwefcfvuvpeqc',
				height: 1974633,
				scriptHash:
					'8e94db4e01581378ca5ae3c495bafc07bc505bd901432a7847c69a407d63696d',
				totalInputValue: 0.00133456,
				matchedInputValue: 0.00133456,
				totalOutputValue: 0.00133206,
				matchedOutputValue: 0.00132,
				fee: 0.0000025,
				satsPerByte: 1,
				type: EPaymentType.sent,
				value: -0.00001456,
				txid: 'ac3f19029332cbd2f2d01544dea8e0d98dd41f3082b05ee24aa84f4f6168e929',
				messages: [],
				timestamp: 1620405043000,
			},
			bd08abb0fc42ea09fb53f12ba8286e753cf615a8665f9e23d995d4788489c610: {
				address: 'tb1qavg2wpnkucp8p0tg9mug8aa6m373peqvjpau3j',
				height: 1974999,
				scriptHash:
					'123ee0aabf117c2ebeb0fe9e7514c0ec356c72cc37d5ac491574545a28629bdc',
				totalInputValue: 0.00132,
				matchedInputValue: 0.00132,
				totalOutputValue: 0.0013175,
				matchedOutputValue: 0.00130439,
				fee: 0.0000025,
				satsPerByte: 1,
				type: EPaymentType.sent,
				value: -0.00001561,
				txid: 'bd08abb0fc42ea09fb53f12ba8286e753cf615a8665f9e23d995d4788489c610',
				messages: [],
				timestamp: 1620730909000,
			},
			'71c61ef6dd1af0a06cb6040459c3b7b2cbe2ab8ec9f4d8abd73eba4931ab0e0c': {
				address: 'tb1qnwvt9sj397tcnkv3p2gmgv2ty99ntxpjwydncv',
				height: 2064116,
				scriptHash:
					'ec1711190e7525c3f01df2d20a0cb5fd6e7697776625c7e675d4529ac4b2e7ae',
				totalInputValue: 0.1570223,
				matchedInputValue: 0,
				totalOutputValue: 0.15702089,
				matchedOutputValue: 0.00123456,
				fee: 0.00000141,
				satsPerByte: 1,
				type: EPaymentType.received,
				value: 0.00123456,
				txid: '71c61ef6dd1af0a06cb6040459c3b7b2cbe2ab8ec9f4d8abd73eba4931ab0e0c',
				messages: [],
				timestamp: 1628558272000,
			},
		},
		bitcoinRegtest: {},
		timestamp: null,
	},
	boostedTransactions: objectTypeItems,
	blacklistedUtxos: {
		bitcoin: [],
		bitcoinTestnet: [],
		bitcoinRegtest: [],
		timestamp: null,
	},
	balance: {
		bitcoin: 0,
		bitcoinTestnet: 128206,
		bitcoinRegtest: 0,
		timestamp: null,
	},
	lastUpdated: {
		bitcoin: 0,
		bitcoinTestnet: 0,
		bitcoinRegtest: 0,
		timestamp: null,
	},
	hasBackedUpWallet: false,
	walletBackupTimestamp: '',
	keyDerivationPath: {
		bitcoin: {
			purpose: '84',
			coinType: '0',
			account: '0',
			change: '0',
			addressIndex: '0',
		},
		bitcoinTestnet: {
			purpose: '84',
			coinType: '0',
			account: '0',
			change: '0',
			addressIndex: '0',
		},
		bitcoinRegtest: {
			purpose: '84',
			coinType: '0',
			account: '0',
			change: '0',
			addressIndex: '0',
		},
	},
	networkTypePath: {
		bitcoin: '0',
		bitcoinTestnet: '1',
		bitcoinRegtest: '0',
	},
	addressType: {
		bitcoin: EAddressType.p2wpkh,
		bitcoinTestnet: EAddressType.p2wpkh,
		bitcoinRegtest: EAddressType.p2wpkh,
	},
	rbfData: {
		bitcoin: {},
		bitcoinTestnet: {},
		bitcoinRegtest: {},
		timestamp: null,
	},
	transaction: {
		bitcoin: defaultBitcoinTransactionData,
		bitcoinTestnet: defaultBitcoinTransactionData,
		bitcoinRegtest: defaultBitcoinTransactionData,
	},
};
