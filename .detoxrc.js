// run iPhone 14 on local machine, iPhone 15 Pro on mac mini
const iOSDevice = process.env.MACMINI ? 'iPhone 15 Pro' : 'iPhone 14';

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
			binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
			build:
				'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd .. ',
		},
		'android.release': {
			type: 'android.apk',
			binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
			build:
				'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
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
				avdName: 'Pixel_API_29_AOSP',
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
