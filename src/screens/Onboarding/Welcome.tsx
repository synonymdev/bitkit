import React, { ReactElement } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { FadeIn } from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Display, Text01S } from '../../styles/text';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Button from '../../components/Button';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import DetectSwipe from '../../components/DetectSwipe';
import type { OnboardingStackScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/figures.png');

const OnboardingWelcomeScreen = ({
	navigation,
}: OnboardingStackScreenProps<'Welcome'>): ReactElement => {
	const { t } = useTranslation('onboarding');

	const onGetStarted = (): void => {
		navigation.navigate('Slideshow');
	};

	const onSkipIntro = (): void => {
		navigation.navigate('Slideshow', { skipIntro: true });
	};

	const onSwipeLeft = (): void => {
		console.log('swiped');
		navigation.navigate('Slideshow');
	};

	return (
		<GlowingBackground topLeft="brand">
			<DetectSwipe onSwipeLeft={onSwipeLeft}>
				<View style={styles.content}>
					<AnimatedView
						style={styles.imageContainer}
						color="transparent"
						entering={FadeIn.duration(1000)}>
						<Image style={styles.floatIllustraion} source={imageSrc} />
					</AnimatedView>

					<View style={styles.textContent}>
						<Trans
							t={t}
							i18nKey="toolkit"
							parent={Display}
							components={{
								brand: <Display color="brand" />,
							}}
						/>

						<Text01S color="gray1" style={styles.text}>
							{t('toolkit_text')}
						</Text01S>

						<View style={styles.buttonsContainer}>
							<Button
								size="large"
								onPress={onGetStarted}
								text={t('get_started')}
								style={[styles.button, styles.restoreButton]}
							/>
							<Button
								size="large"
								variant="secondary"
								onPress={onSkipIntro}
								text={t('skip_intro')}
								style={[styles.button, styles.skipButton]}
								testID="SkipIntro"
							/>
						</View>

						<View style={styles.logoContainer} pointerEvents="none">
							<BitkitLogo height={30} width={72} />
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				</View>
			</DetectSwipe>
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
