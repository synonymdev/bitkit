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
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';

import {
	AnimatedView,
	Caption13M,
	Display,
	Text01M,
	Text01S,
	TouchableOpacity,
	View as ThemedView,
} from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import Button from '../../components/Button';
import { createNewWallet } from '../../utils/startup';
import { showErrorNotification } from '../../utils/notifications';
import { sleep } from '../../utils/helpers';
import useColors from '../../hooks/colors';
import LoadingWalletScreen from './Loading';
import type { OnboardingStackScreenProps } from '../../navigation/types';
import { updateUser } from '../../store/actions/user';

const shieldImageSrc = require('../../assets/illustrations/shield-b.png');
const lightningImageSrc = require('../../assets/illustrations/lightning.png');
const padlockImageSrc = require('../../assets/illustrations/padlock.png');
const walletImageSrc = require('../../assets/illustrations/wallet.png');

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
	const colors = useColors();

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
		() => [
			{
				topLeftColor: colors.brand,

				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image style={illustrationStyles} source={shieldImageSrc} />
						</View>
						<View style={styles.textContent}>
							<Display>Bitcoin,</Display>
							<Display color="brand">Everywhere.</Display>
							<Text01S color="gray1" style={styles.text}>
								Pay anyone, anywhere, any time and spend your Bitcoin on the
								things you value in life.
							</Text01S>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},

			{
				topLeftColor: colors.purple,

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
								friends, family and merchants.
							</Text01S>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},

			{
				topLeftColor: colors.blue,

				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image style={illustrationStyles} source={padlockImageSrc} />
						</View>
						<View style={styles.textContent}>
							<Display>Log in with</Display>
							<Display color="blue">just a Tap.</Display>
							<Text01S color="gray1" style={styles.text}>
								Experience the web without limits: portable profiles & feeds,
								dynamic contacts, passwordless accounts.
							</Text01S>
						</View>
						<SafeAreaInsets type="bottom" />
					</View>
				),
			},

			{
				topLeftColor: colors.brand,

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
								Please note: Bitkit is beta software.
							</Text01S>

							<View style={styles.buttonsContainer}>
								<Button
									size="large"
									style={[styles.button, styles.restoreButton]}
									onPress={onNewWallet}
									text="New Wallet"
									testID="TestNewWallet"
								/>

								<Button
									size="large"
									variant="secondary"
									style={[styles.button, styles.newButton]}
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
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
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

	const glowColor = isCreatingWallet
		? colors.brand
		: slides[index]?.topLeftColor ?? colors.brand;

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

					<AnimatedView style={[styles.adv, advOpacity]}>
						<TouchableOpacity
							style={styles.advToucable}
							onPress={(): void => {
								if (index !== slides.length - 1) {
									return;
								}
								navigation.navigate('Passphrase');
							}}>
							<Caption13M color="gray1">Advanced setup</Caption13M>
						</TouchableOpacity>
					</AnimatedView>

					<View style={styles.dots}>
						{slides.map((backgroundColor, i) => {
							return (
								<Dot
									key={i}
									index={i}
									animValue={progressValue}
									length={slides.length}
								/>
							);
						})}
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

const DOT_SIZE = 7;

const Dot = ({
	animValue,
	index,
	length,
}: {
	index: number;
	length: number;
	animValue: Animated.SharedValue<number>;
}): ReactElement => {
	const width = DOT_SIZE;

	const animStyle = useAnimatedStyle(() => {
		let inputRange = [index - 1, index, index + 1];
		let outputRange = [-width, 0, width];

		if (index === 0 && animValue?.value > length - 1) {
			inputRange = [length - 1, length, length + 1];
			outputRange = [-width, 0, width];
		}

		return {
			transform: [
				{
					translateX: interpolate(animValue?.value, inputRange, outputRange),
				},
			],
		};
	}, [animValue, index, length]);

	return (
		<ThemedView color="gray2" style={styles.dotRoot}>
			<Animated.View style={[styles.dotA, animStyle]} />
		</ThemedView>
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
	dots: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignSelf: 'center',
	},
	dotRoot: {
		width: DOT_SIZE,
		height: DOT_SIZE,
		borderRadius: 5,
		overflow: 'hidden',
		marginHorizontal: 4,
	},
	dotA: {
		borderRadius: 5,
		backgroundColor: 'white',
		flex: 1,
	},
	adv: {
		alignSelf: 'center',
		backgroundColor: 'transparent',
	},
	advToucable: {
		padding: 16,
		backgroundColor: 'transparent',
	},
});

export default memo(Slideshow);
