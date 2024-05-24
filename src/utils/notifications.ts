import Toast from 'react-native-toast-message';
import { __E2E__ } from '../constants/env';

export type ToastOptions = {
	type: 'success' | 'info' | 'lightning' | 'warning' | 'error';
	title: string;
	description: string;
	autoHide?: boolean;
	visibilityTime?: number;
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
	visibilityTime,
}: ToastOptions): void => {
	if (__E2E__) {
		console.log('showToast', { type, title, description });
		return;
	}

	Toast.show({
		...defaultOptions,
		type,
		text1: title,
		text2: description,
		position: 'top',
		autoHide,
		visibilityTime,
	});
};
