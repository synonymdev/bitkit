import React, { ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Display, Text01S } from '../styles/components';
import SafeAreaInsets from '../components/SafeAreaInsets';
import GlowingBackground from '../components/GlowingBackground';
import NavigationHeader from '../components/NavigationHeader';
import Button from '../components/Button';
import useColors from '../hooks/colors';
import type { RootStackScreenProps } from '../navigation/types';
import { openURL } from '../utils/helpers';

const Introduction = ({
	navigation,
}: RootStackScreenProps<'BuyBitcoin'>): ReactElement => {
	const colors = useColors();

	return (
		<GlowingBackground topLeft={colors.orange}>
			<View style={styles.slide}>
				<SafeAreaInsets type="top" />
				<NavigationHeader
					onClosePress={(): void => {
						navigation.navigate('Tabs');
					}}
				/>
				<View style={styles.imageContainer}>
					<Image
						style={styles.image2}
						source={require('../assets/illustrations/b-emboss.png')}
					/>
				</View>
				<View style={styles.textContent}>
					<Display>
						Bitcoin{'\n'}
						<Display color="orange">for Bitkit.</Display>
					</Display>
					<Text01S color="gray1" style={styles.text}>
						Don’t have Bitcoin yet to send to your Bitkit wallet? Stack and
						withdraw some sats using Bitfinex.
					</Text01S>
				</View>

				<View style={styles.buttonsContainer}>
					<Button
						text="Buy Bitcoin"
						size="large"
						style={[styles.button, styles.quickButton]}
						onPress={(): void => {
							openURL('https://www.bitfinex.com/how-to-buy-bitcoin/');
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
		marginTop: 16,
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
