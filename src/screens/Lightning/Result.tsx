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

const imageSrc = require('../../assets/illustrations/switch.png');

const Result = ({
	navigation,
}: LightningScreenProps<'Result'>): ReactElement => {
	const colors = useColors();

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Add Instant Payments"
				displayBackButton={false}
			/>
			<View style={styles.root}>
				<Display color="purple">You’re{'\n'}Connected!</Display>
				<Text01S color="gray1" style={styles.text}>
					You are now connected to the Lightning network. Enjoy instant
					payments!
				</Text01S>

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={600} color="purple" />
					<Image style={styles.image} source={imageSrc} />
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
		paddingBottom: 16,
	},
	text: {
		marginTop: 8,
		marginBottom: 16,
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		height: 200,
		width: 200,
		resizeMode: 'contain',
	},
	glow: {
		position: 'absolute',
	},
});

export default memo(Result);
