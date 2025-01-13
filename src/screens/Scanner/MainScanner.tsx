import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import DetectSwipe from '../../components/DetectSwipe';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import type { RootStackScreenProps } from '../../navigation/types';
import { resetSendTransaction } from '../../store/actions/wallet';
import { showToast } from '../../utils/notifications';
import { processUri } from '../../utils/scanner/scanner';
import ScannerComponent from './ScannerComponent';

const ScannerScreen = ({
	navigation,
	route,
}: RootStackScreenProps<'Scanner'>): ReactElement => {
	const { t } = useTranslation('other');
	const onScan = route.params?.onScan;

	const onSwipeRight = (): void => {
		navigation.popToTop();
	};

	const onRead = (uri: string): void => {
		if (!uri) {
			showToast({
				type: 'warning',
				title: t('qr_error_header'),
				description: t('qr_error_text'),
			});
			return;
		}

		navigation.pop();

		if (onScan) {
			onScan(uri);
			return;
		}

		resetSendTransaction().then(() => {
			processUri({ uri, source: 'mainScanner' }).then();
		});
	};

	return (
		<DetectSwipe onSwipeRight={onSwipeRight}>
			<ScannerComponent onRead={onRead}>
				<SafeAreaInset type="top" />
				<NavigationHeader
					style={styles.navigationHeader}
					title={t('qr_scan')}
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
