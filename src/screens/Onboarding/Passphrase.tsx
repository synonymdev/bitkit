import React, { ReactElement, memo, useState, useMemo } from 'react';
import {
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	View,
	useWindowDimensions,
} from 'react-native';

import { TextInput } from '../../styles/components';
import { Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import Flag from '../../components/Flag';
import type { OnboardingStackScreenProps } from '../../navigation/types';
import { useScreenSize } from '../../hooks/screen';

const imageSrc = require('../../assets/illustrations/padlock2.png');

const Passphrase = ({
	navigation,
}: OnboardingStackScreenProps<'Passphrase'>): ReactElement => {
	const [bip39Passphrase, setPassphrase] = useState<string>('');
	const { isSmallScreen } = useScreenSize();

	const dimensions = useWindowDimensions();
	const illustrationStyles = useMemo(
		() => ({
			...styles.image,
			width: dimensions.width * (isSmallScreen ? 0.6 : 0.7),
			height: dimensions.width * (isSmallScreen ? 0.6 : 0.7),
			...(isSmallScreen ? { marginTop: -30 } : {}),
		}),
		[dimensions.width, isSmallScreen],
	);

	return (
		<GlowingBackground topLeft="brand">
			<KeyboardAvoidingView
				style={styles.slide}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
				<ScrollView
					bounces={false}
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}>
					<SafeAreaInsets type="top" />
					<View style={styles.navigationContainer}>
						<NavigationHeader />
						<Flag text="Advanced" style={styles.flag} />
					</View>
					<View style={styles.imageContainer}>
						<Image style={illustrationStyles} source={imageSrc} />
					</View>
					<View style={styles.textContent}>
						<Display>
							Secure with <Display color="brand">Passphrase</Display>
						</Display>
						<Text01S color="gray1" style={styles.text}>
							You can add a secret passphrase to the 12-word recovery phrase. If
							you do, make sure you don’t forget.
						</Text01S>

						<TextInput
							style={styles.input}
							value={bip39Passphrase}
							onChangeText={setPassphrase}
							returnKeyType="done"
							autoCapitalize="none"
							autoCompleteType="off"
							autoCorrect={false}
							placeholder="Passphrase"
						/>
					</View>

					<View style={styles.buttonContainer}>
						<Button
							text="Create New Wallet"
							size="large"
							style={[styles.button, styles.customButton]}
							onPress={(): void => {
								navigation.navigate('Slideshow', { bip39Passphrase });
							}}
						/>
					</View>
					<SafeAreaInsets type="bottom" />
				</ScrollView>
			</KeyboardAvoidingView>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
	},
	slide: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'stretch',
		marginBottom: 16,
	},
	navigationContainer: {
		position: 'relative',
	},
	flag: {
		position: 'absolute',
		top: 17,
		right: 0,
	},
	imageContainer: {
		flex: 2.8,
		alignItems: 'center',
		marginBottom: 32,
		justifyContent: 'flex-end',
	},
	image: {
		resizeMode: 'contain',
	},
	textContent: {
		// line up Welcome screen content with Slideshow
		flex: Platform.OS === 'ios' ? 3.2 : 3.5,
		paddingHorizontal: 48,
	},
	text: {
		marginTop: 8,
	},
	input: {
		marginTop: 24,
		marginBottom: 16,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		paddingHorizontal: 48,
	},
	button: {
		flex: 1,
	},
	customButton: {
		marginLeft: 6,
	},
});

export default memo(Passphrase);
