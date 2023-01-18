import React, { ReactElement, memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TouchableOpacity } from '../../../styles/components';
import { Caption13Up, Text02B } from '../../../styles/text';
import { SwitchIcon } from '../../../styles/icons';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import AmountToggle from '../../../components/AmountToggle';
import Money from '../../../components/Money';
import ProfileImage from '../../../components/ProfileImage';
import Button from '../../../components/Button';
import SendNumberPad from './SendNumberPad';
import {
	EBitcoinUnit,
	ETransactionDefaults,
} from '../../../store/types/wallet';
import {
	getTransactionOutputValue,
	sendMax,
} from '../../../utils/wallet/transactions';
import { useBalance } from '../../../hooks/wallet';
import { useLightningBalance } from '../../../hooks/lightning';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionMaxSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import {
	bitcoinUnitSelector,
	coinSelectAutoSelector,
	unitPreferenceSelector,
} from '../../../store/reselect/settings';
import { useProfile } from '../../../hooks/slashtags';
import useDisplayValues from '../../../hooks/displayValues';
import { updateSettings } from '../../../store/actions/settings';
import type { SendScreenProps } from '../../../navigation/types';

const ContactImage = ({ url }: { url: string }): JSX.Element => {
	const { profile } = useProfile(url);
	return <ProfileImage url={url} image={profile.image} size={24} />;
};

const Amount = ({ navigation }: SendScreenProps<'Amount'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const onChainBalance = useBalance({ onchain: true });
	const lightningBalance = useLightningBalance(false);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const coinSelectAuto = useSelector(coinSelectAutoSelector);
	const transaction = useSelector(transactionSelector);
	const bitcoinUnit = useSelector(bitcoinUnitSelector);
	const unitPreference = useSelector(unitPreferenceSelector);
	const isMaxSendAmount = useSelector(transactionMaxSelector);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	/*
	 * Total value of all outputs. Excludes change address.
	 */
	const amount = useMemo((): number => {
		return getTransactionOutputValue({
			selectedWallet,
			selectedNetwork,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, selectedNetwork, selectedWallet]);

	const displayValues = useDisplayValues(amount);

	/**
	 * Returns available amount to spend for either onchain or lightning.
	 */
	const availableAmount = useMemo(() => {
		if (transaction.lightningInvoice) {
			return lightningBalance.localBalance;
		}
		if (
			transaction.outputs &&
			transaction.outputs.length > 0 &&
			transaction.outputs[0].address
		) {
			if (onChainBalance.satoshis <= ETransactionDefaults.recommendedBaseFee) {
				return 0;
			}
			return onChainBalance.satoshis - ETransactionDefaults.recommendedBaseFee;
		}
		return 0;
	}, [
		lightningBalance.localBalance,
		onChainBalance.satoshis,
		transaction.lightningInvoice,
		transaction.outputs,
	]);

	const availableAmountProps = useMemo(() => {
		return {
			...(unitPreference !== 'fiat' ? { symbol: true } : { showFiat: true }),
		};
	}, [unitPreference]);

	// BTC -> satoshi -> fiat
	const nextUnit = useMemo(() => {
		if (unitPreference === 'asset') {
			return bitcoinUnit === EBitcoinUnit.BTC ? EBitcoinUnit.satoshi : 'fiat';
		}
		return EBitcoinUnit.BTC;
	}, [bitcoinUnit, unitPreference]);

	const onChangeUnit = (): void => {
		updateSettings({
			unitPreference: nextUnit === 'fiat' ? 'fiat' : 'asset',
			...(nextUnit !== 'fiat' && { bitcoinUnit: nextUnit }),
		});
	};

	const onContinue = useCallback((): void => {
		// If auto coin-select is disabled and there is no lightning invoice.
		if (!coinSelectAuto && !transaction.lightningInvoice) {
			navigation.navigate('CoinSelection');
		} else {
			navigation.navigate('ReviewAndSend');
		}
	}, [coinSelectAuto, transaction.lightningInvoice, navigation]);

	const isInvalid = useCallback(() => {
		// onchain tx, but amount is below dust limit
		if (
			!transaction.lightningInvoice &&
			amount <= ETransactionDefaults.recommendedBaseFee
		) {
			return true;
		}
		// lightning tx, but amount is 0
		if (transaction.lightningInvoice && amount === 0) {
			return true;
		}
		return false;
	}, [amount, transaction.lightningInvoice]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title="Bitcoin Amount"
				actionIcon={
					transaction.slashTagsUrl ? (
						<ContactImage url={transaction.slashTagsUrl} />
					) : undefined
				}
			/>
			<View style={styles.content}>
				<AmountToggle sats={amount} reverse={true} space={16} />

				<View style={styles.numberPad}>
					<View style={styles.actions}>
						<View>
							<Caption13Up style={styles.availableAmountText} color="gray1">
								Available (
								{transaction.lightningInvoice ? 'spending' : 'savings'})
							</Caption13Up>
							<Money
								key="small"
								sats={availableAmount}
								size="caption13M"
								{...availableAmountProps}
							/>
						</View>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white08"
									onPress={(): void => {
										sendMax({ selectedWallet, selectedNetwork });
									}}>
									<Text02B
										size="12px"
										color={isMaxSendAmount ? 'orange' : 'brand'}>
										MAX
									</Text02B>
								</TouchableOpacity>
							</View>

							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white08"
									onPress={onChangeUnit}>
									<SwitchIcon color="brand" width={16.44} height={13.22} />
									<Text02B
										style={styles.actionButtonText}
										size="12px"
										color="brand">
										{nextUnit === 'BTC' && 'BTC'}
										{nextUnit === 'satoshi' && 'sats'}
										{nextUnit === 'fiat' && displayValues.fiatTicker}
									</Text02B>
								</TouchableOpacity>
							</View>
						</View>
					</View>

					<SendNumberPad />
				</View>

				<View style={buttonContainerStyles}>
					<Button
						size="large"
						text="Continue"
						disabled={isInvalid()}
						onPress={onContinue}
					/>
				</View>
			</View>
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
	numberPad: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 450,
	},
	actions: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginTop: 28,
		marginBottom: 5,
		paddingBottom: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	availableAmountText: {
		marginBottom: 5,
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginLeft: 'auto',
	},
	actionButtonContainer: {
		alignItems: 'center',
	},
	actionButton: {
		marginLeft: 16,
		paddingVertical: 7,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButtonText: {
		marginLeft: 11,
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(Amount);
