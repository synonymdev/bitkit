import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { processInputData } from '../../utils/scanner';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import NavigationHeader from '../../components/NavigationHeader';
import { showErrorNotification } from '../../utils/notifications';
import ScannerComponent from './ScannerComponent';
import type { RootStackScreenProps } from '../../navigation/types';
import DetectSwipe from '../../components/DetectSwipe';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';
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
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const sdk = useSlashtagsSDK();

	const onSwipeRight = (): void => {
		navigation.navigate('Wallet');
	};

	const onRead = async (data: string): Promise<void> => {
		if (!data) {
			showErrorNotification({
				title: t('qr_error_header'),
				message: t('qr_error_text'),
			});
			return;
		}

		navigation.pop();

		if (onScan) {
			onScan(data);
			return;
		}

		processInputData({
			data,
			source: 'mainScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		}).then();
	};

	return (
		<DetectSwipe onSwipeRight={onSwipeRight}>
			<ScannerComponent onRead={onRead}>
				<SafeAreaInsets type="top" />
				<NavigationHeader
					style={styles.navigationHeader}
					title={t('qr_scan_any')}
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
