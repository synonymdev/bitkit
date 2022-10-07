import React, { ReactElement } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { Display, Text01S, AnimatedView } from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Button from '../../components/Button';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import useColors from '../../hooks/colors';
import type { OnboardingStackScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/figures.png');

const OnboardingWelcomeScreen = ({
	navigation,
}: OnboardingStackScreenProps<'Welcome'>): ReactElement => {
	const colors = useColors();
	const onSkipIntro = (): void =>
		navigation.navigate('Slideshow', { skipIntro: true });
	const onGetStarted = (): void => navigation.navigate('Slideshow');

	return (
		<GlowingBackground topLeft={colors.brand}>
			<View style={styles.content}>
				<AnimatedView
					style={styles.imageContainer}
					color={'transparent'}
					entering={FadeIn.duration(1000)}>
					<Image style={styles.floatIllustraion} source={imageSrc} />
				</AnimatedView>

				<View style={styles.textContent}>
					<Display>
						Your Bitcoin <Display color="brand">Toolkit.</Display>
					</Display>

					<Text01S color="gray1" style={styles.text}>
						Bitkit hands you the keys to{'\n'}your money, profile, contacts,
						{'\n'}and web accounts.
					</Text01S>

					<View style={styles.buttonsContainer}>
						<Button
							size="large"
							onPress={onGetStarted}
							text="Get Started"
							style={[styles.button, styles.restoreButton]}
						/>
						<Button
							size="large"
							variant="secondary"
							onPress={onSkipIntro}
							text="Skip Intro"
							style={[styles.button, styles.skipButton]}
						/>
					</View>

					<View style={styles.logoContainer}>
						<BitkitLogo height={30} width={72} />
					</View>
					<SafeAreaInsets type="bottom" />
				</View>
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 48,
	},
	imageContainer: {
		flex: 4,
		paddingTop: 20,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
	},
	floatIllustraion: {
		position: 'absolute',
		top: 10,
	},
	textContent: {
		flex: 3.4,
	},
	text: {
		marginTop: 8,
	},
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 20,
		marginBottom: 50,
	},
	button: {
		flex: 1,
		paddingHorizontal: 10,
	},
	restoreButton: {
		marginRight: 6,
	},
	skipButton: {
		marginLeft: 6,
	},
	logoContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		marginBottom: 16,
	},
});

export default OnboardingWelcomeScreen;
