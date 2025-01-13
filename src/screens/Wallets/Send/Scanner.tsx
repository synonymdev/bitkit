import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { processUri } from '../../../utils/scanner/scanner';
import ScannerComponent from '../../Scanner/ScannerComponent';

const ScannerScreen = (): ReactElement => {
	const { t } = useTranslation('other');

	const onRead = async (uri: string): Promise<void> => {
		await processUri({ uri, source: 'send' });
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
