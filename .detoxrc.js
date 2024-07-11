// run iPhone 14 on local machine, iPhone 15 Pro on mac mini
const iOSDevice = process.env.MACMINI ? 'iPhone 15 Pro' : 'iPhone 14';

const reversePorts = [3003, 8080, 8081, 9735, 10009, 28334, 28335, 28336, 39388, 43782, 60001];

/** @type {Detox.DetoxConfig} */
module.exports = {
	testRunner: {
		$0: 'jest',
		args: {
			config: 'e2e/jest.config.js',
			_: ['e2e'],
			forceExit: true,
		},
	},
	apps: {
		'ios.debug': {
			type: 'ios.app',
			binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/bitkit.app',
			build:
				'xcodebuild -workspace ios/bitkit.xcworkspace -scheme bitkit -sdk iphonesimulator -derivedDataPath ios/build',
		},
		'ios.release': {
			type: 'ios.app',
			binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/bitkit.app',
			build:
				'xcodebuild -configuration Release -workspace ios/bitkit.xcworkspace -scheme bitkit -sdk iphonesimulator -derivedDataPath ios/build',
		},
		'android.debug': {
			type: 'android.apk',
			testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
			binaryPath: 'android/app/build/outputs/apk/debug/app-universal-debug.apk',
			build:
				'cd android && ./gradlew app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug && cd .. ',
			reversePorts,
		},
		'android.release': {
			type: 'android.apk',
			testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
			binaryPath: 'android/app/build/outputs/apk/release/app-universal-release.apk',
			build:
				'cd android && ./gradlew app:assembleRelease app:assembleAndroidTest -DtestBuildType=release && cd ..',
			reversePorts,
		},
	},
	devices: {
		simulator: {
			type: 'ios.simulator',
			device: {
				type: iOSDevice,
			},
		},
		emulator: {
			type: 'android.emulator',
			device: {
				avdName: 'Pixel_API_31_AOSP',
			},
		},
	},
	configurations: {
		'ios.debug': {
			device: 'simulator',
			app: 'ios.debug',
		},
		'ios.release': {
			device: 'simulator',
			app: 'ios.release',
		},
		'android.debug': {
			device: 'emulator',
			app: 'android.debug',
		},
		'android.release': {
			device: 'emulator',
			app: 'android.release',
		},
	},
};
