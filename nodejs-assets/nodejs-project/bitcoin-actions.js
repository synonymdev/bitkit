const networks = require("./networks");
const bip39 = require("bip39");
const bip32 = require("bip32");
const bitcoin = require("bitcoinjs-lib");
const {
    sha256,
} = require("./utils");

class BitcoinActions {
    constructor() {
        this.mnemonic = '';
        this.password = '';
        this.seed = '';
        this.root = '';
        this.selectedNetwork = '';
    }

    setup({
        id,
        method = 'setup',
        data: {
            mnemonic = this.mnemonic,
            password = this.password,
            selectedNetwork = this.selectedNetwork,
        }
    }) {
        return new Promise(async (resolve) => {
            try {
                if (!mnemonic) {
                    return resolve({ id, method, error: true, value: 'No mnemonic specified' });
                }
                if (!selectedNetwork) {
                    return resolve({ id, method, error: true, value: 'No network specified' });
                }
                this.mnemonic = mnemonic;
                this.selectedNetwork = selectedNetwork;
                this.password = password;
                this.seed = await bip39.mnemonicToSeed(mnemonic, password);
                const network = networks[selectedNetwork];
                this.root = bip32.fromSeed(this.seed, network);
                return resolve({ id, method, error: false, value: 'Successfully setup bitcoin-actions.' });
            } catch (e) {
                return resolve({id, method, error: true, value: e });
            }
        });
    }

    generateMnemonic({
        id,
        method = 'generateMnemonic',
        data: {
            strength = 128,
        }}) {
        return new Promise((resolve) => {
            try {
                const mnemonic = bip39.generateMnemonic(strength);
                return resolve({id, method, error: false, value: mnemonic});
            } catch (e) {
                return resolve({id, method, error: true, value: e});
            }
        });
    }

    getPrivateKey({
        id,
        method = 'getPrivateKey',
        data: {
            mnemonic = this.mnemonic,
            password = this.password,
            path = '',
            selectedNetwork = this.selectedNetwork,
        }}) {
        return new Promise(async (resolve) => {
            try {
                if (!this.root || !this.seed) {
                    await this.setup({
                        selectedNetwork,
                        data: { mnemonic , password }
                    });
                }

                const addressKeypair = this.root.derivePath(path);
                return resolve({id, method, error: false, value: addressKeypair.toWIF()});
            } catch (e) {
                return resolve({id, method, error: true, value: e});
            }
        });
    }

    getAddress({
        id,
        method = 'getAddress',
        data: {
            path = '',
            type = '',
            selectedNetwork = this.selectedNetwork,
        }}) {
        return new Promise(async (resolve) => {
            if (!this.mnemonic) {
                return resolve({ id, method, error: true, value: 'No mnemonic provided.' });
            }
            if (!this.root || !this.seed) {
                await this.setup({
                    selectedNetwork: this.selectedNetwork,
                    data: { mnemonic: this.mnemonic , password: this.password }
                });
            }
            if (!path) {
                return resolve({ id, method, error: true, value: 'No path provided.' });
            }
            if (!type) {
                return resolve({ id, method, error: true, value: 'No address type provided.' });
            }
            const network = networks[selectedNetwork];
            const keyPair = this.root.derivePath(path);
            let address = '';
            switch (type) {
                case 'p2wpkh':
                    //Get Native Bech32 (bc1) addresses
                    address = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network }).address;
                    break;
                case 'p2sh':
                    //Get Segwit P2SH Address (3)
                    address = bitcoin.payments.p2sh({
                          redeem: bitcoin.payments.p2wpkh({
                              pubkey: keyPair.publicKey,
                              network,
                          }),
                          network,
                      }).address;
                    break;
                case 'p2pkh':
                    //Get Legacy Address (1)
                    address = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network }).address;
                    break;
            }
            const value = {
                address,
                path,
                publicKey: keyPair.publicKey.toString('hex'),
            }
            return resolve({ id, method, error: false, value });
        });
    };

    getScriptHash({
        id,
        method = 'getScriptHash',
        data: {
            address = '',
            selectedNetwork = this.selectedNetwork,
        },
    }) {
        return new Promise((resolve) => {
            try {
                if (!address || !selectedNetwork) {
                    return resolve({ error: true, value: 'No address or network provided.' });
                }
                const network = networks[selectedNetwork];
                const script = bitcoin.address.toOutputScript(address, network);
                const hash = sha256(script);
                const reversedHash = new Buffer(hash.reverse());
                const value = reversedHash.toString('hex');
                return resolve({ id, method, error: false, value });
            } catch (e) {
                return resolve({ error: true, value: e });
            }
        });
    }
}

module.exports = {
    BitcoinActions
}
