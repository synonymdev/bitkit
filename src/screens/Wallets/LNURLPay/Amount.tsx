import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Money from '../../../components/Money';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useBottomSheetScreenBackPress } from '../../../hooks/bottomSheet';
import { useAppSelector } from '../../../hooks/redux';
import { useBalance, useSwitchUnit } from '../../../hooks/wallet';
import type { SendScreenProps } from '../../../navigation/types';
import {
	conversionUnitSelector,
	denominationSelector,
	nextUnitSelector,
	unitSelector,
} from '../../../store/reselect/settings';
import { IColors } from '../../../styles/colors';
import { Caption13Up } from '../../../styles/text';
import { convertToSats } from '../../../utils/conversion';
import { showToast } from '../../../utils/notifications';
import { getNumberPadText } from '../../../utils/numberpad';
import {
	getEstimatedRoutingFee,
	sendMax,
} from '../../../utils/wallet/transactions';
import AssetButton from '../AssetButton';
import SendNumberPad from '../Send/SendNumberPad';
import UnitButton from '../UnitButton';

const LNURLAmount = ({
	navigation,
	route,
}: SendScreenProps<'LNURLAmount'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { pParams, url } = route.params;
	const { minSendable, maxSendable } = pParams;
	const { spendingBalance } = useBalance();
	const switchUnit = useSwitchUnit();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const [text, setText] = useState('');
	const [error, setError] = useState(false);

	useBottomSheetScreenBackPress();

	const amount = useMemo((): number => {
		return convertToSats(text, conversionUnit);
	}, [text, conversionUnit]);

	const max = useMemo(() => {
		const fee = getEstimatedRoutingFee(spendingBalance);
		return Math.min(spendingBalance - fee, maxSendable);
	}, [maxSendable, spendingBalance]);

	const maxSendableProps = {
		...(error && { color: 'brand' as keyof IColors }),
	};

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, denomination, nextUnit);
		setText(result);
		switchUnit();
	};

	const onMaxAmount = useCallback((): void => {
		const result = getNumberPadText(max, denomination, unit);
		setText(result);
		sendMax();
	}, [max, denomination, unit]);

	const onError = (): void => {
		setError(true);
		setTimeout(() => setError(false), 500);
	};

	const onContinue = (): void => {
		if (amount < minSendable) {
			showToast({
				type: 'error',
				title: t('lnurl_pay.error_min.title'),
				description: t('lnurl_pay.error_min.description', {
					amount: minSendable,
				}),
			});
			return;
		}

		navigation.navigate('LNURLConfirm', { amount, pParams, url });
	};

	const isValid = amount > 0 && amount <= max;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('lnurl_p_title')} />
			<View style={styles.content}>
				<NumberPadTextField value={text} testID="SendNumberField" />

				<View style={styles.numberPad} testID="SendAmountNumberPad">
					<View style={styles.actions}>
						<TouchableOpacity onPress={onMaxAmount}>
							<Caption13Up style={styles.maxSendableText} color="secondary">
								{t('lnurl_p_max')}
							</Caption13Up>
							<Money
								key="small"
								sats={max}
								size="bodySSB"
								decimalLength="long"
								testID="maxSendable"
								symbol={true}
								{...maxSendableProps}
							/>
						</TouchableOpacity>
						<View style={styles.actionButtons}>
							<View style={styles.actionButtonContainer}>
								<AssetButton style={styles.actionButton} spending={true} />
							</View>
							<View style={styles.actionButtonContainer}>
								<UnitButton
									style={styles.actionButton}
									testID="SendNumberPadUnit"
									onPress={onChangeUnit}
								/>
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
		gap: 8,
		marginLeft: 'auto',
	},
	actionButtonContainer: {
		alignItems: 'center',
	},
	actionButton: {
		paddingVertical: 7,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(LNURLAmount);
