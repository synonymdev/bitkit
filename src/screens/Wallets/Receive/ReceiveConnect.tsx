import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import { Caption13Up, Text01S } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import AmountToggle from '../../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import GlowImage from '../../../components/GlowImage';
import Money from '../../../components/Money';
import { useScreenSize } from '../../../hooks/screen';
import useDisplayValues from '../../../hooks/displayValues';
import { useLightningBalance } from '../../../hooks/lightning';
import { receiveSelector } from '../../../store/reselect/receive';
import type { ReceiveScreenProps } from '../../../navigation/types';
import { addCJitEntry } from '../../../store/actions/blocktank';

const imageSrc = require('../../../assets/illustrations/lightning.png');

const ReceiveConnect = ({
	navigation,
}: ReceiveScreenProps<'ReceiveConnect'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { isSmallScreen } = useScreenSize();
	const lightningBalance = useLightningBalance(true);
	const { amount, jitOrder } = useSelector(receiveSelector);

	const order = jitOrder!;
	const payAmount = amount - order.feeSat;
	const displayFee = useDisplayValues(order.feeSat);

	const onContinue = (): void => {
		addCJitEntry(order).then();
		navigation.navigate('ReceiveQR');
	};

	const isInitial = lightningBalance.localBalance === 0;
	const imageSize = isSmallScreen ? 130 : 192;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('receive_instantly')} />
			<View style={styles.content}>
				<AmountToggle sats={amount} reverse={true} space={12} />

				<Text01S style={styles.text} color="gray1">
					<Trans
						t={t}
						i18nKey={
							isInitial
								? 'receive_connect_initial'
								: 'receive_connect_additional'
						}
						components={{
							white: <Text01S color="white" />,
						}}
						values={{
							fee: `${displayFee.fiatSymbol}${displayFee.fiatFormatted}`,
						}}
					/>
				</Text01S>

				<View style={styles.payAmount}>
					<Caption13Up style={styles.payAmountText} color="gray1">
						{t('receive_will')}
					</Caption13Up>
					<Money
						sats={payAmount}
						size="title"
						symbol={true}
						testID="AvailableAmount"
					/>
				</View>

				<GlowImage image={imageSrc} glowColor="purple" imageSize={imageSize} />

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						testID="ReceiveConnectContinue"
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 32,
	},
	payAmount: {
		marginTop: 32,
	},
	payAmountText: {
		marginBottom: 5,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ReceiveConnect);
