import React, { ReactElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Headline, Text01S } from '../styles/text';
import { CoinsIcon, SavingsIcon } from '../styles/icons';

type PercentageProps = {
	value: number;
	type: 'spending' | 'savings';
};

const Percentage = ({ value, type }: PercentageProps): ReactElement => (
	<View style={styles.root}>
		{type === 'spending' ? (
			<CoinsIcon color="purple" height={26} width={26} />
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
