import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import RectangleButton from '../../components/buttons/RectangleButton';
import { useAppSelector } from '../../hooks/redux';
import { useBalance } from '../../hooks/wallet';
import type { TransferScreenProps } from '../../navigation/types';
import { useSheetRef } from '../../sheets/SheetRefsProvider';
import { spendingIntroSeenSelector } from '../../store/reselect/settings';
import { isGeoBlockedSelector } from '../../store/reselect/user';
import { View as ThemedView } from '../../styles/components';
import { QrIcon, ShareAndroidIcon, TransferIcon } from '../../styles/icons';
import { BodyM, Display } from '../../styles/text';
import { TRANSACTION_DEFAULTS } from '../../utils/wallet/constants';

const Funding = ({
	navigation,
}: TransferScreenProps<'Funding'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { onchainBalance } = useBalance();
	const receiveSheetRef = useSheetRef('receive');
	const isGeoBlocked = useAppSelector(isGeoBlockedSelector);
	const spendingIntroSeen = useAppSelector(spendingIntroSeenSelector);

	const onTransfer = (): void => {
		if (spendingIntroSeen) {
			navigation.navigate('SpendingAmount');
		} else {
			navigation.navigate('SpendingIntro');
		}
	};

	const onFund = (): void => {
		navigation.popTo('Wallet', { screen: 'Home' });
		receiveSheetRef.current?.present({ screen: 'ReceiveAmount' });
	};

	const onAdvanced = (): void => {
		navigation.navigate('FundingAdvanced');
	};

	const canTransfer = onchainBalance >= TRANSACTION_DEFAULTS.recommendedBaseFee;
	const text = isGeoBlocked ? t('funding.text_blocked') : t('funding.text');

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('funding.nav_title')} />
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
