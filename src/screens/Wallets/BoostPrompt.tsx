import { EBoostType, validateTransaction } from 'beignet';
import React, { memo, ReactElement, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import AdjustValue from '../../components/AdjustValue';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import ImageText from '../../components/ImageText';
import Money from '../../components/Money';
import SafeAreaInset from '../../components/SafeAreaInset';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import Button from '../../components/buttons/Button';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { useFeeText } from '../../hooks/fees';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { rootNavigation } from '../../navigation/root/RootNavigator';
import { resetSendTransaction } from '../../store/actions/wallet';
import { viewControllerSelector } from '../../store/reselect/ui';
import { transactionSelector } from '../../store/reselect/wallet';
import { closeSheet } from '../../store/slices/ui';
import { TOnchainActivityItem } from '../../store/types/activity';
import { EUnit } from '../../store/types/wallet';
import colors from '../../styles/colors';
import { TimerIconAlt } from '../../styles/icons';
import { BodyMSB, BodyS, BodySSB } from '../../styles/text';
import { showToast } from '../../utils/notifications';
import {
	adjustFee,
	broadcastBoost,
	canBoost,
	setupBoost,
	updateFee,
} from '../../utils/wallet/transactions';

const BoostForm = ({
	activityItem,
}: {
	activityItem: TOnchainActivityItem;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const dispatch = useAppDispatch();
	const transaction = useAppSelector(transactionSelector);

	const [preparing, setPreparing] = useState(true);
	const [loading, setLoading] = useState(false);
	const [showCustom, setShowCustom] = useState(false);
	const [origFee, setOrigFee] = useState(1);
	const boostData = useMemo(
		() => canBoost(activityItem.txId),
		[activityItem.txId],
	);

	const { description: duration } = useFeeText(transaction.satsPerByte);

	const boostFee = useMemo(() => {
		return boostData.canBoost ? transaction.fee : 0;
	}, [boostData.canBoost, transaction.fee]);

	useEffect(() => {
		(async (): Promise<void> => {
			const res = await setupBoost({
				txid: activityItem.txId,
			});
			setPreparing(false);
			if (res.isErr()) {
				dispatch(closeSheet('boostPrompt'));
				return;
			}
			setOrigFee(res.value.satsPerByte!);
		})();

		return (): void => {
			resetSendTransaction();
		};
	}, [activityItem.txId, dispatch]);

	const onSwitchView = (): void => {
		if (showCustom) {
			updateFee({ satsPerByte: origFee });
		}
		setShowCustom((prevState) => !prevState);
	};

	const onDecreaseValue = (): void => {
		const res = adjustFee({
			adjustBy: -1,
			transaction,
		});
		if (res.isErr()) {
			showToast({
				type: 'warning',
				title: t('send_fee_error'),
				description: res.error.message,
			});
		}
	};

	const onIncreaseValue = (): void => {
		const res = adjustFee({
			adjustBy: 1,
			transaction,
		});
		if (res.isErr()) {
			showToast({
				type: 'warning',
				title: t('send_fee_error'),
				description: res.error.message,
			});
		}
	};

	const handleBoost = async (): Promise<void> => {
		setLoading(true);
		const transactionIsValid = validateTransaction(transaction);
		if (transactionIsValid.isErr()) {
			setLoading(false);
			showToast({
				type: 'warning',
				title: t('tx_invalid'),
				description: transactionIsValid.error.message,
			});
			return;
		}

		try {
			rootNavigation.goBack();
			const response = await broadcastBoost({
				oldTxId: activityItem.txId,
			});
			if (response.isOk()) {
				dispatch(closeSheet('boostPrompt'));
				showToast({
					type: 'success',
					title: t('boost_success_title'),
					description: t('boost_success_msg'),
				});
			} else {
				showToast({
					type: 'warning',
					title: t('boost_error_title'),
					description: t('boost_error_msg'),
				});
			}
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	if (preparing) {
		return (
			<View style={styles.preparing}>
				<ActivityIndicator />
			</View>
		);
	}

	const Title = (
		<View style={styles.adjustValueRow}>
			<Money
				sats={transaction.satsPerByte}
				unit={EUnit.BTC}
				size="bodyMSB"
				symbol={false}
			/>
			<BodyMSB> {t('sat_vbyte_compact')}</BodyMSB>
		</View>
	);

	const Description = (
		<View style={styles.adjustValueRow}>
			<Money
				sats={boostFee}
				size="bodySSB"
				color="secondary"
				symbol={true}
				unitType="secondary"
			/>
			{/* we can only show duration for RBF, because in case of CPFP we need to calculate averate fee */}
			<BodySSB color="secondary">
				{' '}
				{transaction.boostType === EBoostType.rbf && duration}
			</BodySSB>
		</View>
	);

	return (
		<>
			<BodyS color="secondary">
				{t(showCustom ? 'boost_fee_custom' : 'boost_fee_recomended')}
			</BodyS>

			<View
				style={styles.boostForm}
				testID={
					transaction.boostType === EBoostType.rbf ? 'RBFBoost' : 'CPFPBoost'
				}>
				{showCustom ? (
					<AdjustValue
						value={Title}
						description={Description}
						decreaseValue={onDecreaseValue}
						increaseValue={onIncreaseValue}
						decreaseDisabled={transaction.satsPerByte <= transaction.minFee}
					/>
				) : (
					<ImageText
						title={t('boost')}
						description={duration}
						value={Number(boostFee.toFixed(0))}
						testID="CustomFeeButton"
						icon={<TimerIconAlt color="yellow" width={26} height={26} />}
						onPress={onSwitchView}
					/>
				)}

				<View style={styles.footer}>
					{showCustom && (
						<Button
							style={styles.button}
							text={t('boost_recomended_button')}
							textStyle={styles.buttonText}
							onPress={onSwitchView}
							testID="RecomendedFeeButton"
						/>
					)}

					<SwipeToConfirm
						text={t('boost_swipe')}
						color="yellow"
						icon={<TimerIconAlt width={30} height={30} color="black" />}
						loading={loading}
						confirmed={loading}
						onConfirm={handleBoost}
					/>
				</View>
			</View>
		</>
	);
};

const BoostPrompt = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const snapPoints = useSnapPoints('small');
	const { isOpen, onchainActivityItem } = useAppSelector((state) => {
		return viewControllerSelector(state, 'boostPrompt');
	});

	useBottomSheetBackPress('boostPrompt');

	return (
		<BottomSheetWrapper view="boostPrompt" snapPoints={snapPoints}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title={t('boost_title')}
					showBackButton={false}
				/>

				{isOpen && onchainActivityItem && (
					<BoostForm activityItem={onchainActivityItem} />
				)}

				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 16,
	},
	preparing: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	boostForm: {
		flex: 1,
		marginTop: 24,
	},
	adjustValueRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	footer: {
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginTop: 'auto',
	},
	button: {
		marginBottom: 16,
	},
	buttonText: {
		color: colors.white64,
	},
});

export default memo(BoostPrompt);
