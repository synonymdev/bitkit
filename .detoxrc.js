const reversePorts = [
	3003, 8080, 8081, 9735, 10009, 28334, 28335, 28336, 39388, 43782, 60001,
];

// compile android for x86_64 only
const androidReleaseBuild = process.env.CI
	? 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release -PreactNativeArchitectures=x86_64 && cd ..'
	: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..';

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
			build: 'xcodebuild -workspace ios/bitkit.xcworkspace -scheme bitkit -sdk iphonesimulator -derivedDataPath ios/build',
		},
		'ios.release': {
			type: 'ios.app',
			binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/bitkit.app',
			build: 'xcodebuild -configuration Release -workspace ios/bitkit.xcworkspace -scheme bitkit -sdk iphonesimulator -derivedDataPath ios/build',
		},
		'android.debug': {
			type: 'android.apk',
			testBinaryPath: 'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
			binaryPath: 'android/app/build/outputs/apk/debug/app-universal-debug.apk',
			build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd .. ',
			reversePorts,
		},
		'android.release': {
			type: 'android.apk',
			testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
			binaryPath: 'android/app/build/outputs/apk/release/app-universal-release.apk',
			build: androidReleaseBuild,
			reversePorts,
		},
	},
	devices: {
		simulator: {
			type: 'ios.simulator',
			device: {
				type: 'iPhone 15 Pro',
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
