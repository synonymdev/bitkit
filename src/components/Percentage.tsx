import React, { ReactElement } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Headline, Text01S } from '../styles/text';
import { LightningHollow, SavingsIcon } from '../styles/icons';

type PercentageProps = {
	value: number;
	type: 'spending' | 'savings';
	style?: StyleProp<ViewStyle>;
};

const Percentage = ({ value, type, style }: PercentageProps): ReactElement => (
	<View style={[styles.root, style]}>
		{type === 'spending' ? (
			<LightningHollow color="purple" height={32} width={32} />
		) : (
			<SavingsIcon color="orange" height={32} width={32} />
		)}

		<Headline lineHeight="40px" style={styles.text}>
			{value}
			<Text01S>%</Text01S>
		</Headline>
	</View>
);

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	text: {
		marginLeft: 8,
		paddingTop: Platform.OS === 'android' ? 20 : 0,
	},
});

export default Percentage;
