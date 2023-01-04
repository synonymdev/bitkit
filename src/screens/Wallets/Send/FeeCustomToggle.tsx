import React, { memo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';

import { Display } from '../../../styles/text';
import { LightningIcon } from '../../../styles/icons';
import { useTransactionDetails } from '../../../hooks/transaction';

const FeeCustomToggle = ({ style }: { style?: object }): ReactElement => {
	const transaction = useTransactionDetails();

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
