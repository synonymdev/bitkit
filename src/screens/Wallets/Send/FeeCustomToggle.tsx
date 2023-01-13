import React, { memo, ReactElement } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';

import { Display } from '../../../styles/text';
import { LightningIcon } from '../../../styles/icons';
import { transactionSelector } from '../../../store/reselect/wallet';

const FeeCustomToggle = ({
	style,
}: {
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const transaction = useSelector(transactionSelector);

	return (
		<View style={[styles.row, style]}>
			<LightningIcon height={38} style={styles.symbol} color="gray2" />
			<Display>{transaction.satsPerByte}</Display>
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	symbol: {
		marginRight: 4,
	},
});

export default memo(FeeCustomToggle);
