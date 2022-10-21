import { useEffect, useState } from 'react';
import { Keyboard as RNKeyboard, Platform } from 'react-native';

const useKeyboard = (): {
	keyboardShown: boolean;
} => {
	const [keyboardShown, setKeyboardShown] = useState(false);

	useEffect(() => {
		const keyboardDidShowListener = RNKeyboard.addListener(
			'keyboardDidShow',
			() => {
				setKeyboardShown(true); // or some other action
			},
		);
		const keyboardDidHideListener = RNKeyboard.addListener(
			// ios has keyboardWillHide, android doesn't
			Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
			() => {
				setKeyboardShown(false); // or some other action
			},
		);

		return () => {
			keyboardDidHideListener.remove();
			keyboardDidShowListener.remove();
		};
	}, []);

	return {
		keyboardShown,
	};
};

export const Keyboard = ((): {
	dismiss: () => Promise<void>;
} => {
	let resolve = (): void => {};
	let keyboardShown = false;

	RNKeyboard.addListener('keyboardDidHide', () => {
		keyboardShown = false;
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
