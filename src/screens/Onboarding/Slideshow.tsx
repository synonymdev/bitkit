/* eslint-disable react/no-unstable-nested-components */
import React, { memo, ReactElement, useState, useRef, useMemo } from 'react';
import {
	Image,
	Platform,
	StyleSheet,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	AnimatedView,
	Display,
	Text01M,
	Text01S,
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

const Dot = ({ active }: { active?: boolean }): ReactElement => (
	<ThemedView color={active ? 'white' : 'gray2'} style={styles.pageDot} />
);

/**
 * Slideshow for Welcome screen
 */
const Slideshow = ({
	navigation,
	route,
}: OnboardingStackScreenProps<'Slideshow'>): ReactElement => {
	const skipIntro = route.params?.skipIntro ?? false;
	const swiperRef = useRef<Swiper>(null);
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

	const paginationStyles = useMemo(
		() => ({ paddingBottom: insets.bottom }),
		[insets.bottom],
	);

	const onNewWallet = async (): Promise<void> => {
		setIsCreatingWallet(true);
		await sleep(500); // wait fot animation to be started
		const res = await createNewWallet();
		if (res.isErr()) {
			setIsCreatingWallet(false);
			showErrorNotification({
				title: 'Wallet creation failed',
				message: res.error.message,
			});
		}

		updateUser({ requiresRemoteRestore: false });
	};

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

	const onScroll = (i): void => {
		if (i > slides.length - 1) {
			// react-native-swiper bug. on Andoid
			// If you Skip to last slide and then try to swipe back
			// it calls onScroll with index more that number of slides you have
			i = slides.length - 2;
		}
		setIndex(i);
	};
	const onSkip = (): void => {
		swiperRef.current?.scrollBy(slides.length - 1 - index);
	};

	const [index, setIndex] = useState(skipIntro ? slides.length - 1 : 0);

	if (isCreatingWallet) {
		return (
			<GlowingBackground topLeft={colors.brand}>
				<LoadingWalletScreen />
			</GlowingBackground>
		);
	}

	const glowColor = slides[index]?.topLeftColor ?? colors.brand;

	return (
		<GlowingBackground topLeft={glowColor}>
			<>
				<Swiper
					ref={swiperRef}
					paginationStyle={paginationStyles}
					dot={<Dot />}
					activeDot={<Dot active />}
					loop={false}
					index={index}
					onIndexChanged={onScroll}>
					{slides.map(({ slide: Slide }, i) => (
						<Slide key={i} />
					))}
				</Swiper>

				{index !== slides.length - 1 && (
					<AnimatedView
						entering={FadeIn}
						exiting={FadeOut}
						color="transparent"
						style={styles.headerButtonContainer}>
						<TouchableOpacity style={styles.skipButton} onPress={onSkip}>
							<SafeAreaInsets type="top" />
							<Text01M color="gray1">Skip</Text01M>
						</TouchableOpacity>
					</AnimatedView>
				)}
			</>
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
	pageDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		marginLeft: 4,
		marginRight: 4,
	},
});

export default memo(Slideshow);
