import { useEffect, useState } from 'react';
import { KeyboardEvent, Platform, Keyboard as RNKeyboard } from 'react-native';
import { sleep } from '../utils/helpers';

const useKeyboard = (): {
	keyboardShown: boolean;
	keyboardHeight: number;
} => {
	const [keyboardShown, setKeyboardShown] = useState(false);
	const [keyboardHeight, setKeyboardHeight] = useState(0);

	useEffect(() => {
		const keyboardWillShowListener = RNKeyboard.addListener(
			// ios has keyboardWillShow, android doesn't
			Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
			() => {
				setKeyboardShown(true);
			},
		);
		const keyboardDidShowListener = RNKeyboard.addListener(
			'keyboardDidShow',
			(event: KeyboardEvent) => {
				setKeyboardHeight(event.endCoordinates.height);
			},
		);
		const keyboardDidHideListener = RNKeyboard.addListener(
			// ios has keyboardWillHide, android doesn't
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => {
				setKeyboardShown(false);
				setKeyboardHeight(0);
			},
		);

		return (): void => {
			keyboardWillShowListener.remove();
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	return {
		keyboardShown,
		keyboardHeight,
	};
};

export const Keyboard = ((): {
	dismiss: () => Promise<void>;
} => {
	let resolve = (): void => {};
	let keyboardShown = false;

	RNKeyboard.addListener('keyboardDidHide', async () => {
		keyboardShown = false;
		// needed for Android
		// https://github.com/synonymdev/bitkit/issues/1156
		await sleep(0);
		resolve();
	});

	RNKeyboard.addListener('keyboardDidShow', () => {
		keyboardShown = true;
	});

	// Keyboard.dismiss() that can be awaited
	const dismiss = (): Promise<void> => {
		return new Promise((p) => {
			if (keyboardShown) {
				resolve = p;
				RNKeyboard.dismiss();
			} else {
				p();
			}
		});
	};

	return {
		dismiss,
	};
})();

export default useKeyboard;
