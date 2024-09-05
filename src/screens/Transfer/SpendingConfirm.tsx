import React, { ReactElement, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { Caption13Up, Display } from '../../styles/text';
import { LightningIcon } from '../../styles/icons';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import Button from '../../components/buttons/Button';
import Money from '../../components/Money';
import LightningChannel from '../../components/LightningChannel';
import { sleep } from '../../utils/helpers';
import { showToast } from '../../utils/notifications';
import { useAppSelector } from '../../hooks/redux';
import { TransferScreenProps } from '../../navigation/types';
import { transactionFeeSelector } from '../../store/reselect/wallet';
import { transferLimitsSelector } from '../../store/reselect/aggregations';
import {
	confirmChannelPurchase,
	startChannelPurchase,
} from '../../store/utils/blocktank';

const image = require('../../assets/illustrations/coin-stack-x.png');

const SpendingConfirm = ({
	navigation,
	route,
}: TransferScreenProps<'SpendingConfirm'>): ReactElement => {
	const { order, advanced } = route.params;
	const { t } = useTranslation('lightning');
	const [loading, setLoading] = useState(false);
	const transactionFee = useAppSelector(transactionFeeSelector);
	const limits = useAppSelector(transferLimitsSelector);

	const clientBalance = order.clientBalanceSat;
	const lspBalance = order.lspBalanceSat;
	const lspFee = order.feeSat - clientBalance;
	const totalFee = order.feeSat + transactionFee;

	const onMore = (): void => {
		navigation.navigate('Liquidity', {
			channelSize: clientBalance + lspBalance,
			localBalance: clientBalance,
		});
	};

	const onAdvanced = (): void => {
		navigation.navigate('SpendingAdvanced', { order });
	};

	const onDefault = async (): Promise<void> => {
		const { maxChannelSize } = limits;
		const defaultLspBalance = Math.round(maxChannelSize / 2);

		const response = await startChannelPurchase({
			clientBalance,
			lspBalance: defaultLspBalance,
		});

		if (response.isErr()) {
			const { message } = response.error;
			const description = t('error_channel_setup_msg', { raw: message });

			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description,
			});
			return;
		}

		navigation.setParams({ order: response.value, advanced: false });
	};

	const onConfirm = async (): Promise<void> => {
		setLoading(true);
		await sleep(5);
		const res = await confirmChannelPurchase({ order });
		if (res.isErr()) {
			setLoading(false);
			return;
		}
		navigation.navigate('SettingUp');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
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
						<View style={styles.feeItem}>
							<Caption13Up style={styles.feeItemLabel} color="secondary">
								{t('spending_confirm.network_fee')}
							</Caption13Up>
							<Money sats={transactionFee} size="bodySSB" symbol={true} />
						</View>
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
							<Money sats={clientBalance} size="bodySSB" symbol={true} />
						</View>
						<View style={styles.feeItem}>
							<Caption13Up style={styles.feeItemLabel} color="secondary">
								{t('spending_confirm.total')}
							</Caption13Up>
							<Money sats={totalFee} size="bodySSB" symbol={true} />
						</View>
					</View>
				</View>

				{advanced && (
					<LightningChannel
						style={styles.channel}
						capacity={clientBalance + lspBalance}
						localBalance={clientBalance}
						remoteBalance={lspBalance}
						status="open"
						showLabels={true}
						testID="SpendingConfirmChannel"
					/>
				)}

				<View style={styles.buttons}>
					<Button
						text={t('learn_more')}
						testID="SpendingConfirmMore"
						onPress={onMore}
					/>
					{advanced ? (
						<Button
							text={t('spending_confirm.default')}
							testID="SpendingConfirmDefault"
							onPress={onDefault}
						/>
					) : (
						<Button
							text={t('advanced')}
							testID="SpendingConfirmAdvanced"
							onPress={onAdvanced}
						/>
					)}
				</View>

				{!advanced && (
					<View style={styles.imageContainer}>
						<Image style={styles.image} source={image} />
					</View>
				)}

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
	channel: {
		marginTop: 16,
	},
	buttons: {
		flexDirection: 'row',
		gap: 16,
		marginTop: 16,
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

export default SpendingConfirm;
