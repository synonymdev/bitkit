import {
	BtOpenChannelState,
	BtOrderState2,
	BtPaymentState2,
	IBtOrder,
} from '@synonymdev/blocktank-lsp-http-client';
import React, { ReactElement, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { EChannelStatus } from '../../../store/types/lightning';
import { View as ThemedView } from '../../../styles/components';
import {
	ArrowCounterClock,
	Checkmark,
	ClockIcon,
	HourglassSimpleIcon,
	LightningIcon,
	TimerSpeedIcon,
	XIcon,
} from '../../../styles/icons';
import { BodyMSB } from '../../../styles/text';

const ChannelStatus = ({
	status,
	isUsable,
	order,
}: {
	status: EChannelStatus;
	isUsable: boolean;
	order?: IBtOrder;
}): ReactElement => {
	const { t } = useTranslation('lightning');

	// Use open/closed status from LDK if available
	switch (status) {
		case EChannelStatus.open: {
			if (!isUsable) {
				return (
					<View style={styles.statusRow}>
						<ThemedView style={styles.statusIcon} color="yellow16">
							<LightningIcon color="yellow" width={16} height={16} />
						</ThemedView>
						<BodyMSB color="yellow">{t('order_state.inactive')}</BodyMSB>
					</View>
				);
			}

			return (
				<View style={styles.statusRow}>
					<ThemedView style={styles.statusIcon} color="green16">
						<LightningIcon color="green" width={16} height={16} />
					</ThemedView>
					<BodyMSB color="green">{t('order_state.open')}</BodyMSB>
				</View>
			);
		}
		case EChannelStatus.closed: {
			return (
				<View style={styles.statusRow}>
					<ThemedView style={styles.statusIcon} color="white10">
						<LightningIcon color="secondary" width={16} height={16} />
					</ThemedView>
					<BodyMSB color="secondary">{t('order_state.closed')}</BodyMSB>
				</View>
			);
		}
	}

	if (order) {
		// If the channel is with the LSP, we can show a more accurate status for pending channels
		const orderState = order.state2;
		const paymentState = order.payment.state2;
		const channelState = order.channel?.state;

		if (channelState) {
			switch (channelState) {
				case BtOpenChannelState.OPENING: {
					return (
						<View style={styles.statusRow}>
							<ThemedView style={styles.statusIcon} color="purple16">
								<HourglassSimpleIcon color="purple" width={16} height={16} />
							</ThemedView>
							<BodyMSB color="purple">{t('order_state.opening')}</BodyMSB>
						</View>
					);
				}
			}
		}

		switch (orderState) {
			case BtOrderState2.EXPIRED: {
				return (
					<View style={styles.statusRow}>
						<ThemedView style={styles.statusIcon} color="red16">
							<TimerSpeedIcon color="red" width={16} height={16} />
						</ThemedView>
						<BodyMSB color="red">{t('order_state.expired')}</BodyMSB>
					</View>
				);
			}
		}

		switch (paymentState) {
			case BtPaymentState2.CANCELED: {
				return (
					<View style={styles.statusRow}>
						<ThemedView style={styles.statusIcon} color="red16">
							<XIcon color="red" width={16} height={16} />
						</ThemedView>
						<BodyMSB color="red">{t('order_state.payment_canceled')}</BodyMSB>
					</View>
				);
			}
			case BtPaymentState2.REFUND_AVAILABLE: {
				return (
					<View style={styles.statusRow}>
						<ThemedView style={styles.statusIcon} color="yellow16">
							<ArrowCounterClock color="yellow" width={16} height={16} />
						</ThemedView>
						<BodyMSB color="yellow">
							{t('order_state.refund_available')}
						</BodyMSB>
					</View>
				);
			}
			case BtPaymentState2.REFUNDED: {
				return (
					<View style={styles.statusRow}>
						<ThemedView style={styles.statusIcon} color="white10">
							<ArrowCounterClock color="secondary" width={16} height={16} />
						</ThemedView>
						<BodyMSB color="secondary">{t('order_state.refunded')}</BodyMSB>
					</View>
				);
			}
		}

		switch (paymentState) {
			case BtPaymentState2.CREATED: {
				return (
					<View style={styles.statusRow}>
						<ThemedView style={styles.statusIcon} color="purple16">
							<ClockIcon color="purple" width={16} height={16} />
						</ThemedView>
						<BodyMSB color="purple">
							{t('order_state.awaiting_payment')}
						</BodyMSB>
					</View>
				);
			}
			case BtPaymentState2.PAID: {
				return (
					<View style={styles.statusRow}>
						<ThemedView style={styles.statusIcon} color="purple16">
							<Checkmark color="purple" width={16} height={16} />
						</ThemedView>
						<BodyMSB color="purple">{t('order_state.paid')}</BodyMSB>
					</View>
				);
			}
		}
	}

	switch (status) {
		case EChannelStatus.pending: {
			return (
				<View style={styles.statusRow}>
					<ThemedView style={styles.statusIcon} color="purple16">
						<HourglassSimpleIcon color="purple" width={16} height={16} />
					</ThemedView>
					<BodyMSB color="purple">{t('order_state.opening')}</BodyMSB>
				</View>
			);
		}
	}
};

const styles = StyleSheet.create({
	statusRow: {
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	statusIcon: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 16,
	},
});

export default memo(ChannelStatus);
