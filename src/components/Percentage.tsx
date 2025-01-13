import React, { ReactElement } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BitcoinCircleIcon, LightningCircleIcon } from '../styles/icons';
import { BodyMB, Headline } from '../styles/text';

type PercentageProps = {
	value: number;
	type: 'spending' | 'savings';
	style?: StyleProp<ViewStyle>;
};

const Percentage = ({ value, type, style }: PercentageProps): ReactElement => (
	<View style={[styles.root, style]}>
		{type === 'spending' ? (
			<LightningCircleIcon style={styles.icon} width={32} height={32} />
		) : (
			<BitcoinCircleIcon style={styles.icon} width={32} height={32} />
		)}

		<Headline style={styles.number}>
			{value}
			<BodyMB style={styles.sign}>%</BodyMB>
		</Headline>
	</View>
);

const styles = StyleSheet.create({
	root: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	icon: {
		marginRight: 8,
	},
	number: {
		fontFamily: 'InterTight-Bold',
		fontSize: 34,
		letterSpacing: 0.5,
		// weird font bug here, fix with padding
		paddingTop: Platform.OS === 'android' ? 49 : 40,
	},
	sign: {
		fontSize: 16,
	},
});

export default Percentage;
