/* eslint-disable react/no-unstable-nested-components */
import React, {
	memo,
	ReactElement,
	useState,
	useRef,
	useMemo,
	useEffect,
	useCallback,
} from 'react';
import {
	Image,
	Platform,
	Pressable,
	StyleSheet,
	View,
	useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView, TouchableOpacity } from '../../styles/components';
import { Caption13M, Display, Text01M, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import Dot from '../../components/SliderDots';
import Button from '../../components/Button';
import { createNewWallet } from '../../utils/startup';
import { showErrorNotification } from '../../utils/notifications';
import { sleep } from '../../utils/helpers';
import LoadingWalletScreen from './Loading';
import { updateUser } from '../../store/actions/user';
import { IColors } from '../../styles/colors';
import type { OnboardingStackScreenProps } from '../../navigation/types';

const shieldImageSrc = require('../../assets/illustrations/shield-b.png');
const lightningImageSrc = require('../../assets/illustrations/lightning.png');
const sparkImageSrc = require('../../assets/illustrations/spark.png');
const walletImageSrc = require('../../assets/illustrations/wallet.png');

type Slide = {
	topLeftColor: keyof IColors;
	slide: () => ReactElement;
};

/**
 * Slideshow for Welcome screen
 */
const Slideshow = ({
	navigation,
	route,
}: OnboardingStackScreenProps<'Slideshow'>): ReactElement => {
	const skipIntro = route.params?.skipIntro ?? false;
	const bip39Passphrase = route.params?.bip39Passphrase;
	const ref = useRef<ICarouselInstance | null>(null);
	const [isCreatingWallet, setIsCreatingWallet] = useState(false);
	const insets = useSafeAreaInsets();
	const { t } = useTranslation('onboarding');

	// because we can't properly scala image inside the <Swiper let's calculate with by hand
	const dimensions = useWindowDimensions();
	const illustrationStyles = useMemo(
		() => ({
			...styles.illustration,
			width: dimensions.width * 0.6,
			height: dimensions.width * 0.6,
		}),
		[dimensions.width],
	);

	const onNewWallet = useCallback(async (): Promise<void> => {
		setIsCreatingWallet(true);
		await sleep(500); // wait fot animation to be started
		const res = await createNewWallet({ bip39Passphrase });
		if (res.isErr()) {
			setIsCreatingWallet(false);
			showErrorNotification({
				title: t('error_create'),
				message: res.error.message,
			});
		}

		updateUser({ requiresRemoteRestore: false });
	}, [bip39Passphrase, t]);

	const slides = useMemo(
		(): Slide[] => [
			{
				topLeftColor: 'brand',
				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image style={illustrationStyles} source={shieldImageSrc} />
						</View>
						<View style={styles.textContent}>
							<Trans
								t={t}
								i18nKey="slide1_header"
								parent={Display}
								components={{
									brand: <Display color="brand" />,
								}}
							/>
							<Text01S color="gray1" style={styles.text}>
								{t('slide1_text')}
							</Text01S>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},
			{
				topLeftColor: 'purple',
				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image style={illustrationStyles} source={lightningImageSrc} />
						</View>
						<View style={styles.textContent}>
							<Trans
								t={t}
								i18nKey="slide2_header"
								parent={Display}
								components={{
									purple: <Display color="purple" />,
								}}
							/>
							<Text01S color="gray1" style={styles.text}>
								{t('slide2_text')}
							</Text01S>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},
			{
				topLeftColor: 'blue',
				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image style={illustrationStyles} source={sparkImageSrc} />
						</View>
						<View style={styles.textContent}>
							<Trans
								t={t}
								i18nKey="slide3_header"
								parent={Display}
								components={{
									blue: <Display color="blue" />,
								}}
							/>
							<Text01S color="gray1" style={styles.text}>
								{t('slide3_text')}
							</Text01S>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},
			{
				topLeftColor: 'brand',
				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image style={illustrationStyles} source={walletImageSrc} />
						</View>
						<View style={styles.textContent}>
							<Trans
								t={t}
								i18nKey="slide4_header"
								parent={Display}
								components={{
									brand: <Display color="brand" />,
								}}
							/>

							<Text01S color="gray1" style={styles.text}>
								<Trans
									t={t}
									i18nKey="slide4_text"
									components={{
										brand: <Text01S color="brand" />,
									}}
								/>
							</Text01S>

							<View style={styles.buttonsContainer}>
								<Button
									size="large"
									style={[styles.button, styles.restoreButton]}
									onPress={onNewWallet}
									text={t('new_wallet')}
									testID="NewWallet"
								/>

								<Button
									size="large"
									variant="secondary"
									style={[styles.button, styles.newButton]}
									// eslint-disable-next-line react/prop-types
									onPress={(): void => navigation.navigate('MultipleDevices')}
									text={t('restore')}
									testID="RestoreWallet"
								/>
							</View>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},
		],
		[illustrationStyles, navigation, onNewWallet, t],
	);

	const [index, setIndex] = useState(skipIntro ? slides.length - 1 : 0);
	const progressValue = useSharedValue<number>(
		skipIntro ? slides.length - 1 : 0,
	);

	// skip button should be visible on all slides, except the last one
	const skipOpacity = useAnimatedStyle(() => {
		const opacity = interpolate(
			progressValue.value,
			[0, slides.length - 2, slides.length - 1],
			[1, 1, 0],
		);
		return { opacity };
	}, [slides.length, progressValue]);

	// Advanced button should be visible only on last slide
	const advOpacity = useAnimatedStyle(() => {
		const opacity = interpolate(
			progressValue.value,
			[0, slides.length - 2, slides.length - 1],
			[0, 0, 1],
		);
		return { opacity };
	}, [slides.length, progressValue]);

	// Dots should not be visible on last slide
	const dotsOpacity = useAnimatedStyle(() => {
		const opacity = interpolate(
			progressValue.value,
			[1, slides.length - 2, slides.length - 1],
			[1, 1, 0],
		);
		return { opacity };
	}, [slides.length, progressValue]);

	const onSkip = (): void => {
		ref.current?.scrollTo({ index: slides.length - 1, animated: true });
	};

	useEffect(() => {
		if (skipIntro) {
			progressValue.value = slides.length - 1;
			ref.current?.scrollTo({ index: slides.length - 1, animated: false });
		}
	}, [skipIntro, slides.length, progressValue]);

	useEffect(() => {
		if (bip39Passphrase === undefined) {
			return;
		}
		onNewWallet();
	}, [bip39Passphrase, onNewWallet]);

	const glowColor: keyof IColors = isCreatingWallet
		? 'brand'
		: slides[index]?.topLeftColor ?? 'brand';

	return (
		<GlowingBackground topLeft={glowColor}>
			{isCreatingWallet ? (
				<LoadingWalletScreen />
			) : (
				<>
					<Carousel
						ref={ref}
						loop={false}
						width={dimensions.width}
						height={dimensions.height - 56 - (insets.bottom || 12)}
						data={slides}
						renderItem={({ index: i }): ReactElement => {
							const Slide = slides[i].slide;
							return <Slide key={i} />;
						}}
						onSnapToItem={setIndex}
						onProgressChange={(_, absoluteProgress): void => {
							progressValue.value = absoluteProgress;
						}}
					/>

					<View style={styles.footer}>
						<AnimatedView style={[styles.adv, advOpacity]}>
							<TouchableOpacity
								style={styles.advTouchable}
								onPress={(): void => {
									if (index !== slides.length - 1) {
										return;
									}
									navigation.navigate('Passphrase');
								}}>
								<Caption13M color="gray1">{t('advanced_setup')}</Caption13M>
							</TouchableOpacity>
						</AnimatedView>
						<AnimatedView
							style={[styles.dots, dotsOpacity]}
							pointerEvents="none">
							{slides.map((_backgroundColor, i) => (
								<Dot
									key={i}
									index={i}
									animValue={progressValue}
									length={slides.length}
								/>
							))}
						</AnimatedView>
					</View>

					<AnimatedView
						color="transparent"
						style={[styles.headerButtonContainer, skipOpacity]}>
						<Pressable style={styles.skipButton} onPress={onSkip}>
							<SafeAreaInsets type="top" />
							<Text01M color="gray1">{t('skip')}</Text01M>
						</Pressable>
					</AnimatedView>
				</>
			)}
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	headerButtonContainer: {
		flexDirection: 'row',
		width: '100%',
		justifyContent: 'flex-end',
		top: 20,
		paddingHorizontal: 28,
		position: 'absolute',
	},
	skipButton: {
		backgroundColor: 'transparent',
	},
	slide: {
		flex: 1,
		paddingHorizontal: 48,
	},
	imageContainer: {
		flex: 4,
		alignItems: 'center',
		marginBottom: 32,
		justifyContent: 'flex-end',
		position: 'relative', // for first slide background image
	},
	illustration: {
		resizeMode: 'contain',
	},
	textContent: {
		// line up Welcome screen content with Slideshow
		flex: Platform.OS === 'ios' ? 3.2 : 3.5,
	},
	text: {
		flex: 0.35,
		marginTop: 8,
	},
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 20,
	},
	button: {
		flex: 1,
		paddingHorizontal: 10,
	},
	restoreButton: {
		marginRight: 6,
	},
	newButton: {
		marginLeft: 6,
	},
	footer: {
		position: 'relative',
		justifyContent: 'center',
	},
	dots: {
		position: 'absolute',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignSelf: 'center',
	},
	adv: {
		backgroundColor: 'transparent',
		position: 'absolute',
		alignSelf: 'center',
	},
	advTouchable: {
		padding: 16,
		backgroundColor: 'transparent',
	},
});

export default memo(Slideshow);
