import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '../../../hooks/redux';
import { processInputData, validateInputData } from '../../../utils/scanner';
import { showToast } from '../../../utils/notifications';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import ScannerComponent from '../../Scanner/ScannerComponent';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const ScannerScreen = (): ReactElement => {
	const { t } = useTranslation('other');
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const selectedWallet = useAppSelector(selectedWalletSelector);

	const onRead = async (data: string): Promise<void> => {
		if (!data) {
			showToast({
				type: 'warning',
				title: t('qr_error_header'),
				description: t('qr_error_text'),
			});
			return;
		}

		const decodeRes = await validateInputData({
			data,
			source: 'send',
			showErrors: true,
		});
		if (decodeRes.isOk()) {
			await processInputData({
				data,
				source: 'send',
				selectedNetwork,
				selectedWallet,
			});
		}
	};

	return (
		<>
			<ScannerComponent bottomSheet={true} onRead={onRead}>
				<BottomSheetNavigationHeader
					style={styles.navigationHeader}
					title={t('qr_scan')}
				/>
			</ScannerComponent>
			<SafeAreaInset type="bottom" minPadding={16} />
		</>
	);
};

const styles = StyleSheet.create({
	navigationHeader: {
		zIndex: 100,
	},
});

export default memo(ScannerScreen);
