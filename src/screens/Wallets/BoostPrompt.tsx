import React, { memo, ReactElement, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Text01M, Text02M, Text02S } from '../../styles/text';
import { TimerIconAlt } from '../../styles/icons';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import AdjustValue from '../../components/AdjustValue';
import Store from '../../store/types';
import { closeBottomSheet } from '../../store/actions/ui';
import { resetOnChainTransaction } from '../../store/actions/wallet';
import {
	adjustFee,
	broadcastBoost,
	canBoost,
	setupBoost,
	updateFee,
	validateTransaction,
} from '../../utils/wallet/transactions';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../utils/notifications';
import { btcToSats } from '../../utils/helpers';
import { TOnchainActivityItem } from '../../store/types/activity';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import ImageText from '../../components/ImageText';
import Money from '../../components/Money';
import { useFeeText } from '../../hooks/fees';
import { useAppSelector } from '../../hooks/redux';
import { viewControllerSelector } from '../../store/reselect/ui';
import { updateActivityItem } from '../../store/actions/activity';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../store/reselect/wallet';

const BoostForm = ({
	activityItem,
}: {
	activityItem: TOnchainActivityItem;
}): ReactElement => {
	const feeEstimates = useSelector((store: Store) => store.fees.onchain);
	const transaction = useSelector(transactionSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);

	const [preparing, setPreparing] = useState(true);
	const [loading, setLoading] = useState(false);
	const [showCustom, setShowCustom] = useState(false);
	const boostData = useMemo(() => canBoost(activityItem.id), [activityItem.id]);

	const activityItemFee = btcToSats(activityItem.fee);
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
				txid: activityItem.id,
			});
			setPreparing(false);

			if (res.isErr()) {
				console.log(res.error.message);
				closeBottomSheet('boostPrompt');
			}
		})();

		return (): void => {
			resetOnChainTransaction({ selectedNetwork, selectedWallet });
		};
	}, [activityItem.id, selectedNetwork, selectedWallet]);

	// Set fee to recommended value
	useEffect(() => {
		if (!preparing && !showCustom) {
			const res = updateFee({
				satsPerByte: recommendedFee,
				transaction,
				selectedNetwork,
				selectedWallet,
			});
			if (res.isErr()) {
				showErrorNotification({
					title: 'Error Updating Fee',
					message: res.error.message,
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
			selectedNetwork,
			selectedWallet,
			adjustBy: -1,
			transaction,
		});
		if (res.isErr()) {
			showErrorNotification({
				title: 'Error Updating Fee',
				message: res.error.message,
			});
		}
	};

	const onIncreaseValue = (): void => {
		const res = adjustFee({
			selectedNetwork,
			selectedWallet,
			adjustBy: 1,
			transaction,
		});
		if (res.isErr()) {
			showErrorNotification({
				title: 'Error Updating Fee',
				message: res.error.message,
			});
		}
	};

	const handleBoost = async (): Promise<void> => {
		setLoading(true);
		const transactionIsValid = validateTransaction(transaction);
		if (transactionIsValid.isErr()) {
			setLoading(false);
			showErrorNotification({
				title: 'Transaction Invalid',
				message: transactionIsValid.error.message,
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
				updateActivityItem(activityItem.id, response.value);
				closeBottomSheet('boostPrompt');
				showSuccessNotification({
					title: 'Boost Success',
					message: 'Successfully boosted this transaction.',
				});
			} else {
				showErrorNotification({
					title: 'Boost Error',
					message: 'Unable to boost this transaction.',
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
			<Money sats={transaction.satsPerByte} size="text01m" symbol={true} />
			<Text01M> sat/byte</Text01M>
		</View>
	);

	const Description = (
		<View style={styles.adjustValueRow}>
			<Money
				sats={boostFee}
				size="text02m"
				color="gray1"
				symbol={true}
				showFiat={true}
			/>
			<Text02M color="gray1"> {duration}</Text02M>
		</View>
	);

	return (
		<>
			{showCustom ? (
				<Text02S color="gray1">
					Your transaction may settle faster if you include an additional
					network fee. Set your custom fee below.
				</Text02S>
			) : (
				<Text02S color="gray1">
					Your transaction may settle faster if you include an additional
					network fee. Here is a recommendation:
				</Text02S>
			)}

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
						title="Boost"
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
							text="Use Recommended Fee"
							textStyle={styles.buttonText}
							onPress={onSwitchView}
						/>
					)}

					<SwipeToConfirm
						text="Swipe To Boost"
						color="yellow"
						onConfirm={handleBoost}
						icon={<TimerIconAlt width={30} height={30} color="black" />}
						loading={loading}
						confirmed={loading}
					/>
				</View>
			</View>
		</>
	);
};

const BoostPrompt = (): ReactElement => {
	const snapPoints = useSnapPoints('small');
	const { isOpen, activityItem } = useAppSelector((state) =>
		viewControllerSelector(state, 'boostPrompt'),
	);

	useBottomSheetBackPress('boostPrompt');

	return (
		<BottomSheetWrapper
			view="boostPrompt"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title="Boost transaction"
					displayBackButton={false}
				/>

				{isOpen && activityItem && <BoostForm activityItem={activityItem} />}

				<SafeAreaInsets type="bottom" />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
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
		color: '#8E8E93',
	},
});

export default memo(BoostPrompt);
