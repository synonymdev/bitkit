import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { dispatch } from '../store/helpers';
import { isOnlineSelector } from '../store/reselect/ui';
import { updateUi } from '../store/slices/ui';
import { showToast } from '../utils/notifications';
import { useAppSelector } from './redux';

export const useNetworkConnectivity = (): void => {
	const { t } = useTranslation('other');
	const isOnline = useAppSelector(isOnlineSelector);

	useEffect(() => {
		const unsubscribeNetInfo = NetInfo.addEventListener(({ isConnected }) => {
			if (isConnected) {
				// prevent toast from showing on startup
				if (isOnline !== isConnected) {
					showToast({
						type: 'success',
						title: t('connection_back_title'),
						description: t('connection_back_msg'),
					});
				}
				dispatch(updateUi({ isOnline: true }));
				// FIXME: this runs too often
				// updateExchangeRates();
			} else {
				showToast({
					type: 'warning',
					title: t('connection_issue'),
					description: t('connection_issue_explain'),
				});
				dispatch(updateUi({ isOnline: false }));
			}
		});

		return (): void => {
			unsubscribeNetInfo();
		};
	}, [isOnline, t]);
};
