import React, { ReactElement, memo } from 'react';
import { StyleSheet, View, Image } from 'react-native';

import { Display, Text01S } from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import Glow from '../../components/Glow';
import useColors from '../../hooks/colors';
import type { LightningScreenProps } from '../../navigation/types';

const RebalanceResult = ({
	navigation,
}: LightningScreenProps<'RebalanceResult'>): ReactElement => {
	const colors = useColors();

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Rebalance Successful"
				displayBackButton={false}
			/>
			<View style={styles.root}>
				<View>
					<Display color="purple">Funds{'\n'}Transferred.</Display>
					<Text01S color="gray1" style={styles.text}>
						You have successfully rebalanced your savings and instant spending
						balance.
					</Text01S>
				</View>

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={700} color="purple" />
					<Image
						style={styles.image}
						source={require('../../assets/illustrations/transfer.png')}
					/>
				</View>

				<View>
					<Button
						text="Awesome!"
						size="large"
						onPress={(): void => {
							navigation.popToTop();
							navigation.goBack();
						}}
					/>
					<SafeAreaInsets type="bottom" />
				</View>
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		display: 'flex',
		justifyContent: 'space-between',
		marginTop: 8,
		paddingHorizontal: 16,
		paddingTop: 32,
	},
	text: {
		marginTop: 16,
		marginBottom: 16,
	},
	imageContainer: {
		height: 300,
		width: 300,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		alignSelf: 'center',
	},
	glow: {
		position: 'absolute',
	},
	image: {
		height: 200,
		width: 200,
		resizeMode: 'contain',
	},
});

export default memo(RebalanceResult);
