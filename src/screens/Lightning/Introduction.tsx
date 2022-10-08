import React, { ReactElement } from 'react';
import { Image, StyleSheet } from 'react-native';

import { Display, Text01S, View } from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import useColors from '../../hooks/colors';
import type { LightningScreenProps } from '../../navigation/types';

const Introduction = ({
	navigation,
}: LightningScreenProps<'Introduction'>): ReactElement => {
	const colors = useColors();

	// TODO: add note for US users

	return (
		<GlowingBackground topLeft={colors.purple}>
			<View color="transparent" style={styles.slide}>
				<SafeAreaInsets type="top" />
				<NavigationHeader
					onClosePress={(): void => {
						navigation.navigate('Tabs');
					}}
				/>
				<View color="transparent" style={styles.imageContainer}>
					<Image
						style={styles.image2}
						source={require('../../assets/illustrations/lightning.png')}
					/>
				</View>
				<View color="transparent" style={styles.textContent}>
					<Display>
						Instant <Display color="purple">Payments.</Display>
					</Display>
					<Text01S color="gray1" style={styles.text}>
						Open a Lightning connection and{'\n'}send or receive bitcoin
						instantly.
					</Text01S>
				</View>

				<View color="transparent" style={styles.buttonsContainer}>
					<Button
						text="Quick Setup"
						size="large"
						style={[styles.button, styles.quickButton]}
						onPress={(): void => {
							navigation.navigate('QuickSetup');
						}}
					/>

					<Button
						text="Custom Setup"
						size="large"
						variant="secondary"
						style={[styles.button, styles.customButton]}
						onPress={(): void => {
							navigation.navigate('CustomSetup', { spending: true });
						}}
					/>
				</View>
				<SafeAreaInsets type="bottom" />
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	slide: {
		flex: 1,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'stretch',
	},
	imageContainer: {
		display: 'flex',
		flex: 4,
		alignItems: 'center',
		paddingVertical: 50,
		justifyContent: 'flex-end',
		width: '100%',
	},
	image2: {
		flex: 1,
		resizeMode: 'contain',
	},
	textContent: {
		flex: 3,
		display: 'flex',
		paddingHorizontal: 22,
	},
	text: {
		marginTop: 8,
	},
	buttonsContainer: {
		marginHorizontal: 16,
		flexDirection: 'row',
		marginTop: 70,
	},
	button: {
		flex: 1,
	},
	quickButton: {
		marginRight: 6,
	},
	customButton: {
		marginLeft: 6,
	},
});

export default Introduction;
