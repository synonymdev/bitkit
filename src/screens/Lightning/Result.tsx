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

const Result = ({
	navigation,
}: LightningScreenProps<'Result'>): ReactElement => {
	const colors = useColors();

	return (
		<GlowingBackground topLeft={colors.purple}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Add Instant Payments"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.root}>
				<View>
					<Display color="purple">You’re Connected!</Display>
					<Text01S color="gray1" style={styles.text}>
						You are now connected to the Lightning network. Enjoy instant
						payments!
					</Text01S>

					<View style={styles.imageContainer}>
						<Glow style={styles.glow} size={700} color="purple" />
						<Image
							style={styles.image}
							source={require('../../assets/illustrations/switch.png')}
						/>
					</View>
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

export default memo(Result);
