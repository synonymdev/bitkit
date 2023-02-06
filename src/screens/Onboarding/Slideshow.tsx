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
				title: 'Wallet creation failed',
				message: res.error.message,
			});
		}

		updateUser({ requiresRemoteRestore: false });
	}, [bip39Passphrase]);

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
							<Display>Bitcoin,</Display>
							<Display color="brand">Everywhere.</Display>
							<Text01S color="gray1" style={styles.text}>
								Pay anyone, anywhere, any time, and spend your Bitcoin on the
								things you value in life.
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
							<Display>Lightning</Display>
							<Display color="purple">Fast.</Display>
							<Text01S color="gray1" style={styles.text}>
								Send Bitcoin faster than ever. Enjoy instant transactions with
								friends, family, and merchants.
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
							<Display>Limitless</Display>
							<Display color="blue">Web.</Display>
							<Text01S color="gray1" style={styles.text}>
								Hold the keys to portable profiles, dynamic contacts,
								distributed feeds, and passwordless accounts.
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
							<Display>
								Let’s create
								<Display color="brand"> your Wallet.</Display>
							</Display>
							<Text01S color="gray1" style={styles.text}>
								Please note: Bitkit is <Text01S color="brand">beta </Text01S>
								software.
							</Text01S>

							<View style={styles.buttonsContainer}>
								<Button
									size="large"
									style={[styles.button, styles.restoreButton]}
									onPress={onNewWallet}
									text="New Wallet"
									testID="NewWallet"
								/>

								<Button
									size="large"
									variant="secondary"
									style={[styles.button, styles.newButton]}
									// eslint-disable-next-line react/prop-types
									onPress={(): void => navigation.navigate('RestoreFromSeed')}
									text="Restore"
								/>
							</View>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},
		],
		[illustrationStyles, navigation, onNewWallet],
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
								<Caption13M color="gray1">Advanced Setup</Caption13M>
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
							<Text01M color="gray1">Skip</Text01M>
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
