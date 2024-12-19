import React, { ReactElement, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	TouchableOpacity,
} from '../../../styles/components';
import { Caption13Up, Display } from '../../../styles/text';
import { LightningIcon, PencilIcon } from '../../../styles/icons';
import SafeAreaInset from '../../../components/SafeAreaInset';
import NavigationHeader from '../../../components/NavigationHeader';
import SwipeToConfirm from '../../../components/SwipeToConfirm';
import Money from '../../../components/Money';
import { showToast } from '../../../utils/notifications';
import { createFundedChannel } from '../../../utils/wallet/transfer';
import { useAppSelector } from '../../../hooks/redux';
import { TransferScreenProps } from '../../../navigation/types';
import { transactionFeeSelector } from '../../../store/reselect/wallet';
import { updateBeignetSendTransaction } from '../../../store/actions/wallet';

const image = require('../../../assets/illustrations/coin-stack-x.png');

const ExternalConfirm = ({
	navigation,
	route,
}: TransferScreenProps<'ExternalConfirm'>): ReactElement => {
	const { nodeId, localBalance } = route.params;
	const { t } = useTranslation('lightning');
	const [loading, setLoading] = useState(false);
	const transactionFee = useAppSelector(transactionFeeSelector);

	const lspFee = 0;
	const totalFee = localBalance + transactionFee;

	useFocusEffect(
		useCallback(() => {
			// Using a placeholder address here to enable the FeeCustom screen to function properly.
			// The actual funding address will be updated later in createFundedChannel.
			updateBeignetSendTransaction({
				outputs: [{ address: 'xxx', value: localBalance, index: 0 }],
			});
		}, [localBalance]),
	);

	const onConfirm = async (): Promise<void> => {
		setLoading(true);

		const result = await createFundedChannel({
			counterPartyNodeId: nodeId,
			localBalance,
		});

		if (result.isErr()) {
			showToast({
				type: 'error',
				title: t('error_channel_purchase'),
				description: result.error.message,
			});
			setLoading(false);
			return;
		}

		navigation.navigate('ExternalSuccess');
	};

	const onChangeFee = (): void => {
		navigation.navigate('ExternalFeeCustom');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('external.nav_title')} />
			<View style={styles.content}>
				<Display>
					<Trans
						t={t}
						i18nKey="transfer.confirm"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>

				<View style={styles.fees}>
					<View style={styles.feesRow}>
						<TouchableOpacity
							style={styles.feeItem}
							onPress={onChangeFee}
							testID="SetCustomFee">
							<Caption13Up style={styles.feeItemLabel} color="secondary">
								{t('spending_confirm.network_fee')}
							</Caption13Up>
							<View style={styles.networkFee}>
								<Money sats={transactionFee} size="bodySSB" symbol={true} />
								<PencilIcon height={13} width={13} />
							</View>
						</TouchableOpacity>
						<View style={styles.feeItem}>
							<Caption13Up style={styles.feeItemLabel} color="secondary">
								{t('spending_confirm.lsp_fee')}
							</Caption13Up>
							<Money sats={lspFee} size="bodySSB" symbol={true} />
						</View>
					</View>
					<View style={styles.feesRow}>
						<View style={styles.feeItem}>
							<Caption13Up style={styles.feeItemLabel} color="secondary">
								{t('spending_confirm.amount')}
							</Caption13Up>
							<Money sats={localBalance} size="bodySSB" symbol={true} />
						</View>
						<View style={styles.feeItem}>
							<Caption13Up style={styles.feeItemLabel} color="secondary">
								{t('spending_confirm.total')}
							</Caption13Up>
							<Money sats={totalFee} size="bodySSB" symbol={true} />
						</View>
					</View>
				</View>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={image} />
				</View>

				<View style={styles.buttonContainer}>
					<SwipeToConfirm
						text={t('transfer.swipe')}
						color="purple"
						icon={<LightningIcon width={30} height={30} color="black" />}
						loading={loading}
						confirmed={loading}
						onConfirm={onConfirm}
					/>
				</View>
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
	fees: {
		marginTop: 25,
		gap: 16,
	},
	feesRow: {
		flexDirection: 'row',
		gap: 16,
	},
	feeItem: {
		flex: 1,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		paddingBottom: 16,
	},
	feeItemLabel: {
		marginBottom: 8,
	},
	networkFee: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default ExternalConfirm;
