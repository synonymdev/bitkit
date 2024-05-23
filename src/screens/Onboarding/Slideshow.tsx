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
	ImageSourcePropType,
	Pressable,
	StyleSheet,
	View,
	useWindowDimensions,
	Platform,
} from 'react-native';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { Display, BodyMSB, BodyM } from '../../styles/text';
import { IThemeColors } from '../../styles/themes';
import SafeAreaInset from '../../components/SafeAreaInset';
import Dot from '../../components/SliderDots';
import Button from '../../components/Button';
import LoadingWalletScreen from './Loading';
import { useAppDispatch } from '../../hooks/redux';
import { createNewWallet } from '../../utils/startup';
import { showToast } from '../../utils/notifications';
import { sleep } from '../../utils/helpers';
import { updateUser } from '../../store/slices/user';
import type { OnboardingStackScreenProps } from '../../navigation/types';

type Slide = {
	color: keyof IThemeColors;
	image: ImageSourcePropType;
};

const slide1ImageSrc = require('../../assets/illustrations/keyring.png');
const slide2ImageSrc = require('../../assets/illustrations/lightning.png');
const slide3ImageSrc = require('../../assets/illustrations/spark.png');
const slide4ImageSrc = require('../../assets/illustrations/shield.png');
const slide5ImageSrc = require('../../assets/illustrations/wallet.png');

const slides: Slide[] = [
	{ color: 'blue', image: slide1ImageSrc },
	{ color: 'purple', image: slide2ImageSrc },
	{ color: 'yellow', image: slide3ImageSrc },
	{ color: 'green', image: slide4ImageSrc },
	{ color: 'brand', image: slide5ImageSrc },
];

type SlideProps = Slide & {
	index: number;
	onCreate: () => void;
	onRestore: () => void;
};

const Slide = ({
	index,
	color,
	image,
	onCreate,
	onRestore,
}: SlideProps): ReactElement => {
	const { t } = useTranslation('onboarding');
	const dimensions = useWindowDimensions();

	// because we can't properly scala image inside the <Swiper let's calculate with by hand
	const imageStyles = useMemo(
		() => ({
			...styles.image,
			width: dimensions.width * 0.79,
			height: dimensions.width * 0.79,
		}),
		[dimensions.width],
	);

	const isLast = index === slides.length - 1;

	return (
		<View style={styles.slide} testID={`Slide${index}`}>
			<View style={styles.imageContainer}>
				<Image style={imageStyles} source={image} />
			</View>

			<Trans
				t={t}
				i18nKey={`slide${index}_header`}
				parent={Display}
				components={{ accent: <Display color={color} /> }}
			/>
			<BodyM style={styles.text} color="secondary">
				{t(`slide${index}_text`)}
			</BodyM>

			{isLast ? (
				<View style={styles.buttonsContainer}>
					<Button
						style={styles.button}
						text={t('new_wallet')}
						size="large"
						testID="NewWallet"
						onPress={onCreate}
					/>

					<Button
						style={styles.button}
						text={t('restore')}
						size="large"
						variant="secondary"
						testID="RestoreWallet"
						onPress={onRestore}
					/>
				</View>
			) : (
				<View style={styles.dotsSpacing} />
			)}

			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const Slideshow = ({
	navigation,
	route,
}: OnboardingStackScreenProps<'Slideshow'>): ReactElement => {
	const skipIntro = route.params?.skipIntro ?? false;
	const bip39Passphrase = route.params?.bip39Passphrase;
	const dispatch = useAppDispatch();
	const dimensions = useWindowDimensions();
	const { t } = useTranslation('onboarding');
	const ref = useRef<ICarouselInstance>(null);
	const progressValue = useSharedValue(0);
	const [isCreatingWallet, setIsCreatingWallet] = useState(false);

	// dots and 'skip' button should not be visible on last slide
	const startOpacity = useAnimatedStyle(() => {
		const opacity = interpolate(
			progressValue.value,
			[1, slides.length - 2, slides.length - 1],
			[1, 1, 0],
		);
		return { opacity };
	}, [slides.length, progressValue]);

	// 'advanced' button should be visible only on last slide
	const endOpacity = useAnimatedStyle(() => {
		const opacity = interpolate(
			progressValue.value,
			[0, slides.length - 2, slides.length - 1],
			[0, 0, 1],
		);
		return { opacity };
	}, [slides.length, progressValue]);

	const onHeaderButton = (): void => {
		const isLast = progressValue.value === slides.length - 1;
		if (isLast) {
			navigation.navigate('Passphrase');
		} else {
			ref.current?.scrollTo({ index: slides.length - 1, animated: true });
		}
	};

	const onCreateWallet = useCallback(async (): Promise<void> => {
		setIsCreatingWallet(true);
		await sleep(500); // wait for animation to be started
		const res = await createNewWallet({ bip39Passphrase });
		if (res.isErr()) {
			setIsCreatingWallet(false);
			showToast({
				type: 'warning',
				title: t('error_create'),
				description: res.error.message,
			});
		}

		dispatch(updateUser({ requiresRemoteRestore: false }));
	}, [bip39Passphrase, t, dispatch]);

	const onRestoreWallet = (): void => {
		navigation.navigate('MultipleDevices');
	};

	useEffect(() => {
		if (bip39Passphrase) {
			onCreateWallet();
		}
	}, [bip39Passphrase, onCreateWallet]);

	return (
		<ThemedView style={styles.root}>
			{isCreatingWallet ? (
				<LoadingWalletScreen />
			) : (
				<>
					<Carousel
						ref={ref}
						loop={false}
						width={dimensions.width}
						data={slides}
						defaultIndex={skipIntro ? slides.length - 1 : 0}
						onProgressChange={(_, absoluteProgress): void => {
							progressValue.value = absoluteProgress;
						}}
						renderItem={({ index }): ReactElement => (
							<Slide
								key={`slide-${index}`}
								index={index}
								color={slides[index].color}
								image={slides[index].image}
								onCreate={onCreateWallet}
								onRestore={onRestoreWallet}
							/>
						)}
					/>

					<Animated.View style={[styles.headerButtonContainer, startOpacity]}>
						<Pressable testID="SkipButton" onPress={onHeaderButton}>
							<SafeAreaInset type="top" />
							<BodyMSB color="secondary">{t('skip')}</BodyMSB>
						</Pressable>
					</Animated.View>

					<Animated.View style={[styles.headerButtonContainer, endOpacity]}>
						<Pressable testID="Passphrase" onPress={onHeaderButton}>
							<SafeAreaInset type="top" />
							<BodyMSB color="secondary">{t('advanced_setup')}</BodyMSB>
						</Pressable>
					</Animated.View>

					<Animated.View
						style={[styles.dots, startOpacity]}
						pointerEvents="none">
						{slides.map((_, i) => (
							<Dot
								key={i}
								index={i}
								animValue={progressValue}
								length={slides.length}
							/>
						))}
					</Animated.View>
				</>
			)}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	slide: {
		flex: 1,
		paddingHorizontal: 32,
	},
	headerButtonContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		width: '100%',
		position: 'absolute',
		top: 20,
		paddingHorizontal: 28,
	},
	imageContainer: {
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginBottom: 48,
		marginTop: 'auto',
	},
	image: {
		resizeMode: 'contain',
	},
	text: {
		marginTop: 4,
		minHeight: 90,
	},
	buttonsContainer: {
		flexDirection: 'row',
		gap: 16,
	},
	button: {
		flex: 1,
	},
	dotsSpacing: {
		height: 55,
	},
	dots: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		position: 'absolute',
		...Platform.select({
			ios: {
				bottom: 60,
			},
			android: {
				bottom: 40,
			},
		}),
	},
});

export default memo(Slideshow);
