package com.bitkit.modules.BitcoinAddressGenerator

import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import uniffi.mobile.getPrivateKey
import uniffi.mobile.getScriptHash
import uniffi.mobile.getAddress
import uniffi.mobile.sayHi

class BitcoinAddressGeneratorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "BitcoinAddressGenerator"
    }

    override fun getConstants(): Map<String, Any> {
        return mapOf("requiresMainQueueSetup" to false)
    }

    @ReactMethod
    fun sayHello(callback: Callback) {
        val message = sayHi()
        callback.invoke(message)
        //callback.invoke("Hello World from Kotlin")
    }

    @ReactMethod
    fun getAddress(mnemonic: String, derivationPath: String, networkType: String, callback: Callback) {
        try {
            val result = getAddress(mnemonic, derivationPath, networkType)
            callback.invoke(result)
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }

    @ReactMethod
    fun getPrivateKey(mnemonic: String, derivationPath: String, networkType: String, bip39_passphrase: String, callback: Callback) {
        try {
            val result = getPrivateKey(mnemonic, derivationPath, networkType, bip39_passphrase)
            callback.invoke(result)
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }

    @ReactMethod
    fun getScriptHash(address: String, networkType: String, callback: Callback) {
        try {
            val result = getScriptHash(address, networkType)
            callback.invoke(result)
        } catch (e: Exception) {
            callback.invoke(e.message, null)
        }
    }
}