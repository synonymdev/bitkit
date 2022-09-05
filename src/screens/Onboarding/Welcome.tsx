import React, { ReactElement } from 'react';
import { StyleSheet, Image } from 'react-native';
import { FadeIn } from 'react-native-reanimated';
import { Display, Text01S, View, AnimatedView } from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Button from '../../components/Button';
import BitKitLogo from '../../assets/bitkit-logo.svg';
import useColors from '../../hooks/colors';

const OnboardingWelcomeScreen = ({
	navigation,
}: {
	navigation: any;
}): ReactElement => {
	const colors = useColors();
	const onSkipIntro = (): void =>
		navigation.navigate('Slideshow', { skipIntro: true });
	const onGetStarted = (): void => navigation.navigate('Slideshow');

	return (
		<GlowingBackground topLeft={colors.brand}>
			<View color={'transparent'} style={styles.content}>
				<View color={'transparent'} style={styles.slide}>
					<AnimatedView
						style={styles.imageContainer}
						color={'transparent'}
						entering={FadeIn.duration(1000)}>
						<Image
							style={styles.floatIllustraion}
							source={require('../../assets/illustrations/figures.png')}
						/>
					</AnimatedView>

					<View color={'transparent'} style={styles.textContent}>
						<Display>
							Your Bitcoin <Display color="brand">Toolkit.</Display>
						</Display>

						<Text01S color="gray1" style={styles.text2}>
							Bitkit hands you the keys to your money, profile, contacts, and
							web services.
						</Text01S>

						<View style={styles.buttonsContainer} color={'transparent'}>
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

						<View style={styles.logoContainer} color={'transparent'}>
							<BitKitLogo width={72} />
							<SafeAreaInsets type={'bottom'} />
						</View>
					</View>
				</View>
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'space-between',
	},
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 40,
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
	},
	slide: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	imageContainer: {
		flex: 4,
		paddingTop: 20,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
	},
	textContent: {
		flex: 3,
		justifyContent: 'space-between',
		width: '100%',
		paddingHorizontal: 48,
	},
	text2: {
		marginTop: 8,
	},
	floatIllustraion: {
		position: 'absolute',
		top: 10,
	},
});

export default OnboardingWelcomeScreen;
