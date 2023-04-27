import { Alert, AlertButton, AlertOptions } from 'react-native';

// re-export Alert with dark colors
export const showAlert = (
	title: string,
	message: string,
	buttons: AlertButton[],
	options?: AlertOptions,
): void => {
	Alert.alert(title, message, buttons, {
		...options,
		userInterfaceStyle: 'dark',
	});
};
