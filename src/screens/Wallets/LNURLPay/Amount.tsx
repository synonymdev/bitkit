import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
	useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TouchableOpacity } from '../../../styles/components';
import { Caption13Up, Text02B } from '../../../styles/text';
import { SwitchIcon } from '../../../styles/icons';
import { IColors } from '../../../styles/colors';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Money from '../../../components/Money';
import NumberPadTextField from '../../../components/NumberPadTextField';
import Button from '../../../components/Button';
import { sendMax } from '../../../utils/wallet/transactions';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { primaryUnitSelector } from '../../../store/reselect/settings';
import { useAppSelector } from '../../../hooks/redux';
import { useSwitchUnit } from '../../../hooks/wallet';
import { useCurrency } from '../../../hooks/displayValues';
import { getNumberPadText } from '../../../utils/numberpad';
import { convertToSats } from '../../../utils/conversion';
import type { LNURLPayProps } from '../../../navigation/types';
import SendNumberPad from '../Send/SendNumberPad';

const Amount = ({
	navigation,
	route,
}: LNURLPayProps<'Amount'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { pParams } = route.params;
	const { minSendable, maxSendable } = pParams;
	const { fiatTicker } = useCurrency();
	const [nextUnit, switchUnit] = useSwitchUnit();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const unit = useAppSelector(primaryUnitSelector);
	const [text, setText] = useState('');
	const [error, setError] = useState(false);

	// Set initial text for NumberPadTextField
	useEffect(() => {
		const result = getNumberPadText(minSendable, unit);
		setText(result);
	}, [selectedWallet, selectedNetwork, minSendable, unit]);

	const amount = useMemo((): number => {
		return convertToSats(text, unit);
	}, [text, unit]);

	const maxSendableProps = {
		...(error && { color: 'brand' as keyof IColors }),
	};

	const isMaxSendAmount = amount === maxSendable;

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, nextUnit);
		setText(result);
		switchUnit();
	};

	const onMaxAmount = useCallback((): void => {
		const result = getNumberPadText(maxSendable, unit);
		setText(result);
		sendMax({ selectedWallet, selectedNetwork });
	}, [maxSendable, unit, selectedWallet, selectedNetwork]);

	const onError = (): void => {
		setError(true);
		setTimeout(() => setError(false), 500);
	};

	const isValid = amount >= minSendable && amount <= maxSendable;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('lnurl_p_title')} />
			<View style={styles.content}>
				<NumberPadTextField value={text} testID="SendNumberField" />

				<View style={styles.numberPad} testID="SendAmountNumberPad">
					<View style={styles.actions}>
						<View>
							<Caption13Up style={styles.maxSendableText} color="gray1">
								{t('lnurl_p_max')}
							</Caption13Up>
							<Money
								key="small"
								sats={maxSendable}
								size="text02m"
								decimalLength="long"
								testID="maxSendable"
								symbol={true}
								{...maxSendableProps}
							/>
						</View>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white10"
									testID="SendNumberPadMax"
									onPress={onMaxAmount}>
									<Text02B
										size="12px"
										color={isMaxSendAmount ? 'orange' : 'brand'}>
										{t('send_max')}
									</Text02B>
								</TouchableOpacity>
							</View>

							<View style={styles.actionButtonContainer}>
								<TouchableOpacity
									style={styles.actionButton}
									color="white10"
									onPress={onChangeUnit}
									testID="SendNumberPadUnit">
									<SwitchIcon color="brand" width={16.44} height={13.22} />
									<Text02B
										style={styles.actionButtonText}
										size="12px"
										color="brand">
										{nextUnit === 'BTC' && fiatTicker}
										{nextUnit === 'satoshi' && 'BTC'}
										{nextUnit === 'fiat' && 'sats'}
									</Text02B>
								</TouchableOpacity>
							</View>
						</View>
					</View>

					<SendNumberPad
						value={text}
						maxAmount={maxSendable}
						onChange={setText}
						onError={onError}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						disabled={!isValid}
						testID="ContinueAmount"
						onPress={(): void => {
							navigation.navigate('Confirm', { amount, pParams });
						}}
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
	numberPad: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 435,
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
	maxSendableText: {
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
