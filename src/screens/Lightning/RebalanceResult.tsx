import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Display, Text01S } from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import type { LightningScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/transfer.png');

const RebalanceResult = ({
	navigation,
}: LightningScreenProps<'RebalanceResult'>): ReactElement => {
	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Rebalance Successful"
				displayBackButton={false}
			/>
			<View style={styles.root}>
				<Display color="purple">Funds{'\n'}Transferred.</Display>
				<Text01S color="gray1" style={styles.text}>
					You have successfully rebalanced your savings and instant spending
					balance.
				</Text01S>

				<GlowImage image={imageSrc} glowColor="purple" />

				<View>
					<Button
						text="Awesome!"
						size="large"
						onPress={(): void => {
							navigation.popToTop();
							navigation.goBack();
						}}
					/>
				</View>
			</View>
			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 8,
		marginBottom: 16,
	},
});

export default memo(RebalanceResult);
