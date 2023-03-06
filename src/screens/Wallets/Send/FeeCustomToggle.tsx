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
			<LightningIcon
				style={styles.symbol}
				width={24}
				height={38}
				color="gray2"
			/>
			<Display lineHeight="57px">{transaction.satsPerByte}</Display>
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	symbol: {
		marginRight: 4,
	},
});

export default memo(FeeCustomToggle);
