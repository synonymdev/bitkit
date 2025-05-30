import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
	useEffect,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Money from '../../../components/Money';
import NumberPadTextField from '../../../components/NumberPadTextField';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useAppSelector } from '../../../hooks/redux';
import { useSwitchUnit } from '../../../hooks/wallet';
import type { LNURLWithdrawScreenProps } from '../../../navigation/types';
import {
	conversionUnitSelector,
	denominationSelector,
	nextUnitSelector,
	unitSelector,
} from '../../../store/reselect/settings';
import { IColors } from '../../../styles/colors';
import { Caption13Up } from '../../../styles/text';
import { convertToSats } from '../../../utils/conversion';
import { getNumberPadText } from '../../../utils/numberpad';
import { sendMax } from '../../../utils/wallet/transactions';
import AssetButton from '../AssetButton';
import SendNumberPad from '../Send/SendNumberPad';
import UnitButton from '../UnitButton';

const Amount = ({
	navigation,
	route,
}: LNURLWithdrawScreenProps<'Amount'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { params } = route.params;
	const { minWithdrawable, maxWithdrawable } = params;
	const switchUnit = useSwitchUnit();
	const unit = useAppSelector(unitSelector);
	const nextUnit = useAppSelector(nextUnitSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const denomination = useAppSelector(denominationSelector);
	const [text, setText] = useState('');
	const [error, setError] = useState(false);

	// Set initial text for NumberPadTextField
	useEffect(() => {
		const result = getNumberPadText(minWithdrawable, denomination, unit);
		setText(result);
	}, [minWithdrawable, denomination, unit]);

	const amount = useMemo((): number => {
		return convertToSats(text, conversionUnit);
	}, [text, conversionUnit]);

	const maxWithdrawableProps = {
		...(error && { color: 'brand' as keyof IColors }),
	};

	const onChangeUnit = (): void => {
		const result = getNumberPadText(amount, denomination, nextUnit);
		setText(result);
		switchUnit();
	};

	const onMaxAmount = useCallback((): void => {
		const result = getNumberPadText(maxWithdrawable, denomination, unit);
		setText(result);
		sendMax();
	}, [maxWithdrawable, denomination, unit]);

	const onError = (): void => {
		setError(true);
		setTimeout(() => setError(false), 500);
	};

	const isValid = amount >= minWithdrawable && amount <= maxWithdrawable;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('lnurl_w_title')} />
			<View style={styles.content}>
				<NumberPadTextField value={text} testID="SendNumberField" />

				<View style={styles.numberPad} testID="SendAmountNumberPad">
					<View style={styles.actions}>
						<TouchableOpacity onPress={onMaxAmount}>
							<Caption13Up style={styles.maxWithdrawableText} color="secondary">
								{t('lnurl_w_max')}
							</Caption13Up>
							<Money
								key="small"
								sats={maxWithdrawable}
								size="bodySSB"
								testID="maxWithdrawable"
								symbol={true}
								{...maxWithdrawableProps}
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
						maxAmount={maxWithdrawable}
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
							navigation.navigate('Confirm', { amount, params });
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
	maxWithdrawableText: {
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
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(Amount);
