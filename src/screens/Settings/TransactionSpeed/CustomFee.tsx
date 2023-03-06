import React, { ReactElement, memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Caption13Up, Display } from '../../../styles/text';
import { LightningIcon } from '../../../styles/icons';
import { customFeeRateSelector } from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/actions/settings';
import { ETransactionSpeed } from '../../../store/types/settings';
import SafeAreaView from '../../../components/SafeAreaView';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import FeeNumberPad from './FeeNumberPad';
import type { SettingsScreenProps } from '../../../navigation/types';

const FeeCustom = ({
	navigation,
}: SettingsScreenProps<'CustomFee'>): ReactElement => {
	const customFeeRate = useSelector(customFeeRateSelector);
	const [feeRate, setFeeRate] = useState(customFeeRate);

	const isValid = feeRate !== 0;

	return (
		<SafeAreaView>
			<NavigationHeader title="Set Custom Fee" displayBackButton={isValid} />
			<View style={styles.container} testID="CustomFee">
				<Caption13Up color="gray1" style={styles.title}>
					Sat / vbyte
				</Caption13Up>
				<View style={styles.row}>
					<LightningIcon
						style={styles.symbol}
						width={24}
						height={38}
						color="gray2"
					/>
					<Display lineHeight="57px">{feeRate}</Display>
				</View>

				<FeeNumberPad
					style={styles.numberPad}
					value={feeRate}
					onChange={(value): void => setFeeRate(value)}
				/>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text="Continue"
						disabled={!isValid}
						testID="Continue"
						onPress={(): void => {
							updateSettings({
								customFeeRate: feeRate,
								transactionSpeed: ETransactionSpeed.custom,
							});
							navigation.goBack();
						}}
					/>
				</View>
				<SafeAreaInsets type="bottom" />
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	title: {
		marginBottom: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	symbol: {
		marginRight: 4,
	},
	numberPad: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 360,
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(FeeCustom);
