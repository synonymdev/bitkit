import React, { memo, ReactElement, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { validateTransaction } from 'beignet';

import colors from '../../styles/colors';
import { BodyMSB, BodySSB, BodyS } from '../../styles/text';
import { TimerIconAlt } from '../../styles/icons';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import SafeAreaInset from '../../components/SafeAreaInset';
import AdjustValue from '../../components/AdjustValue';

import { closeSheet } from '../../store/slices/ui';
import { resetSendTransaction } from '../../store/actions/wallet';
import {
	adjustFee,
	broadcastBoost,
	canBoost,
	setupBoost,
	updateFee,
} from '../../utils/wallet/transactions';
import { showToast } from '../../utils/notifications';
import { TOnchainActivityItem } from '../../store/types/activity';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/buttons/Button';
import ImageText from '../../components/ImageText';
import Money from '../../components/Money';
import { useFeeText } from '../../hooks/fees';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { viewControllerSelector } from '../../store/reselect/ui';
import { updateOnchainActivityItem } from '../../store/slices/activity';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../store/reselect/wallet';
import { EUnit } from '../../store/types/wallet';

const BoostForm = ({
	activityItem,
}: {
	activityItem: TOnchainActivityItem;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const dispatch = useAppDispatch();
	const feeEstimates = useAppSelector((store) => store.fees.onchain);
	const transaction = useAppSelector(transactionSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const selectedWallet = useAppSelector(selectedWalletSelector);

	const [preparing, setPreparing] = useState(true);
	const [loading, setLoading] = useState(false);
	const [showCustom, setShowCustom] = useState(false);
	const boostData = useMemo(
		() => canBoost(activityItem.txId),
		[activityItem.txId],
	);

	const activityItemFee = activityItem.fee;
	const recommendedFee = feeEstimates.fast;
	const { description: duration } = useFeeText(transaction.satsPerByte);

	const boostFee = useMemo(() => {
		if (!boostData.canBoost) {
			return 0;
		}
		if (!boostData.rbf) {
			return transaction.fee;
		}
		return Math.abs(transaction.fee - activityItemFee);
	}, [boostData.canBoost, boostData.rbf, transaction.fee, activityItemFee]);

	useEffect(() => {
		(async (): Promise<void> => {
			const res = await setupBoost({
				selectedWallet,
				selectedNetwork,
				txid: activityItem.txId,
			});
			setPreparing(false);

			if (res.isErr()) {
				console.log(res.error.message);
				dispatch(closeSheet('boostPrompt'));
			}
		})();

		return (): void => {
			resetSendTransaction();
		};
	}, [activityItem.txId, selectedNetwork, selectedWallet, dispatch]);

	// Set fee to recommended value
	useEffect(() => {
		if (!preparing && !showCustom) {
			const res = updateFee({
				satsPerByte: recommendedFee,
				transaction,
			});
			if (res.isErr()) {
				showToast({
					type: 'warning',
					title: t('send_fee_error'),
					description: res.error.message,
				});
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [preparing, showCustom, selectedNetwork, selectedWallet]);

	const onSwitchView = (): void => {
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
			const response = await broadcastBoost({
				selectedWallet,
				selectedNetwork,
				oldTxId: activityItem.txId,
				oldFee: activityItem.fee,
			});
			if (response.isOk()) {
				// Optimistically/immediately update activity item
				dispatch(
					updateOnchainActivityItem({
						id: activityItem.id,
						data: response.value,
					}),
				);
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
				symbol={true}
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
			<BodySSB color="secondary"> {duration}</BodySSB>
		</View>
	);

	return (
		<>
			<BodyS color="secondary">
				{t(showCustom ? 'boost_fee_custom' : 'boost_fee_recomended')}
			</BodyS>

			<View style={styles.boostForm}>
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
					displayBackButton={false}
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
