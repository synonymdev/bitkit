import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useAppSelector } from '../../hooks/redux';
import { useTranslation } from 'react-i18next';

import { processInputData } from '../../utils/scanner';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import { showToast } from '../../utils/notifications';
import ScannerComponent from './ScannerComponent';
import type { RootStackScreenProps } from '../../navigation/types';
import DetectSwipe from '../../components/DetectSwipe';
import { resetSendTransaction } from '../../store/actions/wallet';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';

const ScannerScreen = ({
	navigation,
	route,
}: RootStackScreenProps<'Scanner'>): ReactElement => {
	const { t } = useTranslation('other');
	const onScan = route.params?.onScan;
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const selectedWallet = useAppSelector(selectedWalletSelector);

	const onSwipeRight = (): void => {
		navigation.navigate('Wallet');
	};

	const onRead = (data: string): void => {
		if (!data) {
			showToast({
				type: 'warning',
				title: t('qr_error_header'),
				description: t('qr_error_text'),
			});
			return;
		}

		navigation.pop();

		if (onScan) {
			onScan(data);
			return;
		}

		resetSendTransaction().then(() => {
			processInputData({
				data,
				source: 'mainScanner',
				selectedNetwork,
				selectedWallet,
			}).then();
		});
	};

	return (
		<DetectSwipe onSwipeRight={onSwipeRight}>
			<ScannerComponent onRead={onRead}>
				<SafeAreaInset type="top" />
				<NavigationHeader
					style={styles.navigationHeader}
					title={t('qr_scan')}
					onClosePress={(): void => navigation.pop()}
				/>
			</ScannerComponent>
		</DetectSwipe>
	);
};

const styles = StyleSheet.create({
	navigationHeader: {
		zIndex: 100,
	},
});

export default memo(ScannerScreen);
