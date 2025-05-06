import { EPaymentType } from 'beignet';
import React, { ReactElement, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import { ActivityIndicator } from '../../components/ActivityIndicator';
import AmountToggle from '../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useLightningMaxInboundCapacity } from '../../hooks/lightning';
import { GiftScreenProps } from '../../navigation/types';
import { useSheetRef } from '../../sheets/SheetRefsProvider';
import { dispatch } from '../../store/helpers';
import { addActivityItem } from '../../store/slices/activity';
import { updateSettings } from '../../store/slices/settings';
import {
	EActivityType,
	TLightningActivityItem,
} from '../../store/types/activity';
import { createLightningInvoice } from '../../store/utils/lightning';
import { showSheet } from '../../store/utils/ui';
import { BodyM } from '../../styles/text';
import { giftOrder, giftPay, openChannel } from '../../utils/blocktank';
import { vibrate } from '../../utils/helpers';

const imageSrc = require('../../assets/illustrations/gift.png');

const Loading = ({
	navigation,
	route,
}: GiftScreenProps<'Loading'>): ReactElement => {
	const { code, amount } = route.params;
	const { t } = useTranslation('other');
	const sheetRef = useSheetRef('gift');
	const maxInboundCapacity = useLightningMaxInboundCapacity();

	// biome-ignore lint/correctness/useExhaustiveDependencies: on mount
	const getGift = useCallback(async (): Promise<void> => {
		const getWithoutLiquidity = async (): Promise<void> => {
			const orderResult = await giftOrder(code);

			if (orderResult.isErr()) {
				if (orderResult.error.message.includes('GIFT_CODE_ALREADY_USED')) {
					navigation.navigate('Used', { amount });
				} else {
					navigation.navigate('Error');
				}

				return;
			}

			const { orderId } = orderResult.value;

			if (!orderId) {
				navigation.navigate('Error');
				return;
			}

			const openResult = await openChannel(orderId);

			if (openResult.isErr()) {
				navigation.navigate('Error');
				return;
			}

			const order = openResult.value;

			const activityItem: TLightningActivityItem = {
				id: order.channel?.fundingTx.id ?? '',
				activityType: EActivityType.lightning,
				txType: EPaymentType.received,
				status: 'successful',
				message: code,
				address: '',
				value: order.clientBalanceSat,
				confirmed: true,
				timestamp: new Date().getTime(),
			};

			dispatch(addActivityItem(activityItem));
			dispatch(updateSettings({ hideOnboardingMessage: true }));
			vibrate({ type: 'default' });
			sheetRef.current?.close();
			showSheet('receivedTx', {
				id: activityItem.id,
				activityType: EActivityType.lightning,
				value: activityItem.value,
			});
		};

		const getWithLiquidity = async (): Promise<void> => {
			const invoiceResult = await createLightningInvoice({
				amountSats: 0,
				description: `blocktank-gift-code:${code}`,
				expiryDeltaSeconds: 3600,
			});

			if (invoiceResult.isErr()) {
				navigation.navigate('Error');
				return;
			}

			const invoice = invoiceResult.value.to_str;
			const result = await giftPay(invoice);

			if (result.isErr()) {
				if (result.error.message.includes('GIFT_CODE_ALREADY_USED')) {
					navigation.navigate('Used', { amount });
				} else {
					navigation.navigate('Error');
				}

				return;
			}

			sheetRef.current?.close();
		};

		if (maxInboundCapacity >= amount) {
			await getWithLiquidity();
		} else {
			await getWithoutLiquidity();
		}
	}, []);

	useEffect(() => {
		getGift();
	}, [getGift]);

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader title={t('gift.claiming.title')} />

			<View style={styles.content}>
				<AmountToggle amount={amount} />

				<BodyM style={styles.text} color="secondary">
					{t('gift.claiming.text')}
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.footer}>
					<ActivityIndicator size={32} />
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 32,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
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
	footer: {
		marginTop: 'auto',
		marginBottom: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default Loading;
