import React, { memo, ReactElement, useState, useRef, useMemo } from 'react';
import {
	Image,
	StyleSheet,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import Swiper from 'react-native-swiper';
import { FadeIn, FadeOut } from 'react-native-reanimated';
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
import ComingSoon from '../../components/ComingSoon';
import { createNewWallet } from '../../utils/startup';
import { showErrorNotification } from '../../utils/notifications';
import { sleep } from '../../utils/helpers';
import useColors from '../../hooks/colors';
import LoadingWalletScreen from './Loading';

const Dot = ({ active }: { active?: boolean }): ReactElement => {
	return (
		<ThemedView color={active ? 'white' : 'gray2'} style={styles.pageDot} />
	);
};

/**
 * Slideshow for Welcome screen
 */
const Slideshow = ({
	navigation,
	route,
}: {
	navigation: any;
	route: { params: { skipIntro?: boolean } };
}): ReactElement => {
	const skipIntro = route?.params?.skipIntro;
	const swiperRef = useRef(null);
	const [isCreatingWallet, setIsCreatingWallet] = useState(false);
	const colors = useColors();
	// because we can't properly scala image inside the <Swiper let's calculate with by hand
	const dimensions = useWindowDimensions();
	const illustrationStyles = useMemo(
		() => ({
			...styles.illustration,
			width: dimensions.width * 0.75,
			height: dimensions.width * 0.8,
		}),
		[dimensions.width],
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
	};

	const slides = useMemo(
		() => [
			{
				topLeftColor: colors.brand,
				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image
								style={illustrationStyles}
								source={require('../../assets/illustrations/shield-b.png')}
							/>
						</View>
						<View style={styles.textContent}>
							<Display>
								Bitcoin,
								<Display color="brand"> Everywhere.</Display>
							</Display>
							<Text01S color="gray1" style={styles.text}>
								Pay anyone, anywhere, any time and spend your Bitcoin on the
								things that you value in life.
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
							<Image
								style={illustrationStyles}
								source={require('../../assets/illustrations/lightning.png')}
							/>
						</View>
						<View style={styles.textContent}>
							<Display>
								Lightning
								<Display color="purple"> Fast.</Display>
							</Display>
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
				topLeftColor: colors.green,
				slide: (): ReactElement => (
					<View style={styles.slide}>
						<View style={styles.imageContainer}>
							<Image
								style={illustrationStyles}
								source={require('../../assets/illustrations/coins.png')}
							/>
						</View>
						<View style={styles.textContent}>
							<View style={styles.comingSoonContainer}>
								<ComingSoon style={styles.comingSoon} />
								<Display>
									Instant{'\n'}
									<Display color="green">Tether.</Display>
								</Display>
							</View>
							<Text01S color="gray1" style={styles.text}>
								Save and spend traditional currency, gifts, rewards, and digital
								assets instantly and borderless.
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
							<Image
								style={illustrationStyles}
								source={require('../../assets/illustrations/padlock.png')}
							/>
						</View>
						<View style={styles.textContent}>
							<Display>
								Log in with
								<Display color="blue"> just a Tap.</Display>
							</Display>
							<Text01S color="gray1" style={styles.text}>
								Experience the web without passwords. Use Slashtags to take
								control of your accounts & contacts.
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
							<Image
								style={illustrationStyles}
								source={require('../../assets/illustrations/wallet.png')}
							/>
						</View>
						<View style={styles.textContent}>
							<Display>
								Let’s create
								<Display color="brand"> your Wallet.</Display>
							</Display>

							<View style={styles.buttonsContainer}>
								<Button
									size="large"
									style={[styles.button, styles.restoreButton]}
									onPress={onNewWallet}
									text="New wallet"
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

	return (
		<GlowingBackground topLeft={slides[index].topLeftColor}>
			<>
				<Swiper
					ref={swiperRef}
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
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 70,
	},
	button: {
		flex: 1,
	},
	restoreButton: {
		marginRight: 6,
	},
	newButton: {
		marginLeft: 6,
	},

	slide: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'stretch',
	},
	imageContainer: {
		flex: 4,
		alignItems: 'center',
		paddingVertical: 25,
		justifyContent: 'flex-end',
		position: 'relative', // for first slide background image
	},
	illustration: {
		resizeMode: 'contain',
	},
	textContent: {
		flex: 3,
		paddingHorizontal: 48,
	},
	pageDot: {
		width: 7,
		height: 7,
		borderRadius: 4,
		marginLeft: 4,
		marginRight: 4,
		marginBottom: 30, // lift dot's up
	},
	text: {
		marginTop: 8,
	},
	comingSoonContainer: {
		position: 'relative',
	},
	comingSoon: {
		position: 'absolute',
		right: -48,
		bottom: 0,
	},
});

export default memo(Slideshow);
