//
//  BitcoinAddressGenerator.swift
//  bitkit
//
//  Created by Corey Phillips on 4/2/24.
//

import Foundation

@objc(BitcoinAddressGenerator)
class BitcoinAddressGenerator: NSObject {

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc func sayHello(_ callback: RCTResponseSenderBlock) {
        callback([sayHi()])
    }

    @objc func getAddress(_ mnemonic: String, derivationPath: String, networkType: String, callback: RCTResponseSenderBlock) {
      let result = bitkit.getAddress(mnemonic: mnemonic, derivationPath: derivationPath, networkType: networkType)
        callback([result])
    }
  
    @objc func getPrivateKey(_ mnemonic: String, derivationPath: String, networkType: String, bip39Passphrase: String, callback: RCTResponseSenderBlock) {
        let result = bitkit.getPrivateKey(mnemonic: mnemonic, derivationPath: derivationPath, networkType: networkType, bip39Passphrase: bip39Passphrase)
        callback([result])
    }

    @objc func getScriptHash(_ address: String, network: String, callback: RCTResponseSenderBlock) {
        let result = bitkit.getScriptHash(address: address, network: network)
        callback([result])
    }
}
