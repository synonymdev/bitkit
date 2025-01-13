import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Image, ImageBackground, StyleSheet, View } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import DetectSwipe from '../../components/DetectSwipe';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import type { OnboardingStackScreenProps } from '../../navigation/types';
import { setGeoBlock } from '../../store/utils/user';
import { AnimatedView } from '../../styles/components';
import { BodyM, Display } from '../../styles/text';

const backgroundSrc = require('../../assets/illustrations/figures.png');
const logoSrc = require('../../assets/logo.png');

const OnboardingWelcomeScreen = ({
	navigation,
}: OnboardingStackScreenProps<'Welcome'>): ReactElement => {
	const { t } = useTranslation('onboarding');

	const onGetStarted = (): void => {
		setGeoBlock();
		navigation.navigate('Slideshow');
	};

	const onSkipIntro = (): void => {
		navigation.navigate('Slideshow', { skipIntro: true });
	};

	const onSwipeLeft = (): void => {
		navigation.navigate('Slideshow');
	};

	return (
		<ImageBackground style={styles.root} source={backgroundSrc}>
			<DetectSwipe onSwipeLeft={onSwipeLeft}>
				<View style={styles.content}>
					<AnimatedView
						style={styles.logoContainer}
						color="transparent"
						entering={FadeIn.duration(1000)}>
						<Image style={styles.logo} source={logoSrc} />
					</AnimatedView>

					<View style={styles.textContent}>
						<Trans
							t={t}
							i18nKey="welcome_title"
							parent={Display}
							components={{ accent: <Display color="brand" /> }}
						/>

						<BodyM style={styles.text} color="secondary">
							{t('welcome_text')}
						</BodyM>

						<View style={styles.buttonsContainer}>
							<Button
								style={[styles.button, styles.restoreButton]}
								text={t('get_started')}
								size="large"
								testID="GetStarted"
								onPress={onGetStarted}
							/>
							<Button
								style={[styles.button, styles.skipButton]}
								text={t('skip_intro')}
								size="large"
								variant="secondary"
								testID="SkipIntro"
								onPress={onSkipIntro}
							/>
						</View>
						<SafeAreaInset type="bottom" minPadding={16} />
					</View>
				</View>
			</DetectSwipe>
		</ImageBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
	},
	logoContainer: {
		flex: 1,
		paddingBottom: 70,
		justifyContent: 'center',
		alignItems: 'center',
	},
	logo: {
		width: 270,
		resizeMode: 'contain',
	},
	textContent: {
		marginTop: 'auto',
	},
	text: {
		marginTop: 4,
	},
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 32,
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
});

export default OnboardingWelcomeScreen;
