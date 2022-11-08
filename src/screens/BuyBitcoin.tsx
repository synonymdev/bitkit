import React, { ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { Display, Text01S } from '../styles/components';
import SafeAreaInsets from '../components/SafeAreaInsets';
import GlowingBackground from '../components/GlowingBackground';
import NavigationHeader from '../components/NavigationHeader';
import Button from '../components/Button';
import useColors from '../hooks/colors';
import { openURL } from '../utils/helpers';
import { removeTodo } from '../store/actions/todos';
import type { RootStackScreenProps } from '../navigation/types';

const imageSrc = require('../assets/illustrations/b-emboss.png');

const BuyBitcoin = ({
	navigation,
}: RootStackScreenProps<'BuyBitcoin'>): ReactElement => {
	const colors = useColors();

	return (
		<GlowingBackground topLeft={colors.orange}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View style={styles.textContent}>
					<Display>
						Bitcoin{'\n'}
						<Display color="orange">for Bitkit.</Display>
					</Display>
					<Text01S color="gray1" style={styles.text}>
						Don’t have Bitcoin yet to send to your Bitkit wallet? Stack some
						sats.
					</Text01S>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text="Buy Bitcoin"
						size="large"
						onPress={(): void => {
							removeTodo('buyBitcoin');
							openURL('https://bitcoin.org/en/exchanges');
						}}
					/>
				</View>
			</View>
			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		marginHorizontal: 16,
	},
	imageContainer: {
		flex: 3.2,
		alignItems: 'center',
		paddingVertical: 50,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	textContent: {
		flex: 3,
		paddingHorizontal: 4,
	},
	text: {
		marginTop: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		marginBottom: 16,
	},
	button: {
		flex: 1,
	},
});

export default BuyBitcoin;
