const networks = require('bitcoinjs-lib').networks;
module.exports = {
    bitcoin: networks.bitcoin,
    bitcoinTestnet: networks.testnet,
    bitcoinRegtest: networks.regtest,
};
