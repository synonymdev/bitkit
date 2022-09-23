import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

const useKeyboard = (): {
	keyboardShown: boolean;
} => {
	const [keyboardShown, setKeyboardShown] = useState(false);

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			'keyboardDidShow',
			() => {
				setKeyboardShown(true); // or some other action
			},
		);
		const keyboardDidHideListener = Keyboard.addListener(
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

export default useKeyboard;
