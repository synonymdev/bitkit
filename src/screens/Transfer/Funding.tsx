import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSelector } from '../../hooks/redux';
import { Trans, useTranslation } from 'react-i18next';

import { TransferIcon, QrIcon, ShareAndroidIcon } from '../../styles/icons';
import { Display, BodyM } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import RectangleButton from '../../components/buttons/RectangleButton';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import { useBalance } from '../../hooks/wallet';
import { isGeoBlockedSelector } from '../../store/reselect/user';
import { TRANSACTION_DEFAULTS } from '../../utils/wallet/constants';
import { showBottomSheet } from '../../store/utils/ui';
import type { TransferScreenProps } from '../../navigation/types';

const Funding = ({
	navigation,
}: TransferScreenProps<'Funding'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { onchainBalance } = useBalance();
	const isGeoBlocked = useAppSelector(isGeoBlockedSelector);

	const onTransfer = (): void => {
		navigation.navigate('SpendingIntro');
	};

	const onFund = (): void => {
		navigation.navigate('Wallet');
		showBottomSheet('receiveNavigation', { receiveScreen: 'ReceiveAmount' });
	};

	const onAdvanced = (): void => {
		navigation.navigate('FundingAdvanced');
	};

	const canTransfer = onchainBalance >= TRANSACTION_DEFAULTS.recommendedBaseFee;
	const text = isGeoBlocked ? t('funding.text_blocked') : t('funding.text');

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('funding.nav_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content}>
				<Display>
					<Trans
						t={t}
						i18nKey="funding.title"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				<BodyM color="secondary" style={styles.text}>
					{text}
				</BodyM>

				<RectangleButton
					icon={<TransferIcon color="purple" width={32} height={30} />}
					text={t('funding.button1')}
					disabled={!canTransfer || isGeoBlocked}
					testID="FundTransfer"
					onPress={onTransfer}
				/>

				<RectangleButton
					icon={<QrIcon color="purple" width={32} height={30} />}
					text={t('funding.button2')}
					disabled={isGeoBlocked}
					testID="FundReceive"
					onPress={onFund}
				/>

				<RectangleButton
					icon={<ShareAndroidIcon color="purple" width={32} height={30} />}
					text={t('funding.button3')}
					testID="FundCustom"
					onPress={onAdvanced}
				/>
			</View>

			{/* <Dialog
				visible={showDialog}
				title={t('no_funds.title')}
				description={t('no_funds.description')}
				buttonColor="purple"
				cancelText={t('cancel')}
				confirmText={t('no_funds.fund')}
				onCancel={(): void => {
					setShowDialog(false);
				}}
				onConfirm={(): void => {
					setShowDialog(false);
					showBottomSheet('receiveNavigation');
				}}
			/> */}
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 32,
	},
});

export default Funding;
