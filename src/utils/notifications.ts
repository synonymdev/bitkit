import Toast from 'react-native-toast-message';
import { __E2E__ } from '../constants/env';

export type ToastOptions = {
	type: 'success' | 'error' | 'info';
	title: string;
	description: string;
	autoHide?: boolean;
};

const defaultOptions = {
	autoHide: true,
	visibilityTime: 4000,
	topOffset: 40,
	bottomOffset: 120,
};

export const showToast = ({
	type,
	title,
	description,
	autoHide,
}: ToastOptions): void => {
	if (__E2E__) {
		return;
	}

	Toast.show({
		...defaultOptions,
		type,
		text1: title,
		text2: description,
		position: 'top',
		autoHide,
	});
};
