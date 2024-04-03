//
//  BitcoinAddressGenerator.m
//  bitkit
//
//  Created by Corey Phillips on 4/2/24.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BitcoinAddressGenerator, NSObject)

RCT_EXTERN_METHOD(sayHello:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getAddress:(NSString *)mnemonic
                  derivationPath:(NSString *)derivationPath
                  networkType:(NSString *)networkType
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getPrivateKey:(NSString *)mnemonic
                  derivationPath:(NSString *)derivationPath
                  networkType:(NSString *)networkType
                  bip39Passphrase:(NSString *)bip39Passphrase
                  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getScriptHash:(NSString *)address
                  network:(NSString *)network
                  callback:(RCTResponseSenderBlock)callback)

@end
