import React, { ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, Text01S } from '../styles/text';
import SafeAreaInset from '../components/SafeAreaInset';
import GlowingBackground from '../components/GlowingBackground';
import NavigationHeader from '../components/NavigationHeader';
import Button from '../components/Button';
import { openURL } from '../utils/helpers';
import { hideTodo } from '../store/actions/todos';
import type { RootStackScreenProps } from '../navigation/types';

const imageSrc = require('../assets/illustrations/b-emboss.png');

const BuyBitcoin = ({
	navigation,
}: RootStackScreenProps<'BuyBitcoin'>): ReactElement => {
	const { t } = useTranslation('other');

	return (
		<GlowingBackground topLeft="orange">
			<SafeAreaInset type="top" />
			<NavigationHeader
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content}>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View style={styles.textContent}>
					<Display>
						<Trans
							t={t}
							i18nKey="buy_header"
							components={{
								orange: <Display color="orange" />,
							}}
						/>
					</Display>
					<Text01S color="gray1" style={styles.text}>
						{t('buy_text')}
					</Text01S>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('buy_button')}
						size="large"
						onPress={(): void => {
							hideTodo('buyBitcoin');
							openURL('https://bitcoin.org/en/exchanges');
						}}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		marginHorizontal: 32,
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
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default BuyBitcoin;
