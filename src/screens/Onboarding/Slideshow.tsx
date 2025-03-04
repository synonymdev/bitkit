import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
	Image,
	ImageSourcePropType,
	Platform,
	StyleSheet,
	View,
	useWindowDimensions,
} from 'react-native';
import Animated, {
	interpolate,
	useAnimatedStyle,
	useSharedValue,
} from 'react-native-reanimated';
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel';

import SafeAreaInset from '../../components/SafeAreaInset';
import Dot from '../../components/SliderDots';
import Button from '../../components/buttons/Button';
import ButtonTertiary from '../../components/buttons/ButtonTertiary';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import type { OnboardingStackScreenProps } from '../../navigation/types';
import { isGeoBlockedSelector } from '../../store/reselect/user';
import { updateUser } from '../../store/slices/user';
import { View as ThemedView } from '../../styles/components';
import { BodyM, BodyMB, Display, Footnote } from '../../styles/text';
import { IThemeColors } from '../../styles/themes';

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
	const isGeoBlocked = useAppSelector(isGeoBlockedSelector);

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

			<View style={styles.text}>
				<Trans
					t={t}
					i18nKey={`slide${index}_text`}
					parent={BodyM}
					color="secondary"
					components={{ accent: <BodyMB color="primary" /> }}
				/>

				{index === 1 && isGeoBlocked && (
					<Footnote style={styles.note}>{t('slide1_note')}</Footnote>
				)}
			</View>

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
	const [isLastSlide, setIsLastSlide] = useState(false);

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

	const scrollToSlide = (index: number): void => {
		ref.current?.scrollTo({ index, animated: true });
	};

	const onHeaderButton = (): void => {
		if (isLastSlide) {
			navigation.navigate('Passphrase');
		} else {
			scrollToSlide(slides.length - 1);
		}
	};

	const onCreateWallet = useCallback((): void => {
		dispatch(updateUser({ requiresRemoteRestore: false }));
		navigation.navigate('CreateWallet', {
			action: 'create',
			bip39Passphrase,
		});
	}, [bip39Passphrase, dispatch, navigation]);

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
			<Carousel
				ref={ref}
				loop={false}
				width={dimensions.width}
				data={slides}
				defaultIndex={skipIntro ? slides.length - 1 : 0}
				onProgressChange={(_, absoluteProgress): void => {
					progressValue.value = absoluteProgress;
					setIsLastSlide(absoluteProgress === slides.length - 1);
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

			<View style={styles.headerButtons}>
				<SafeAreaInset type="top" />
				<Animated.View style={[styles.headerButton, startOpacity]}>
					<ButtonTertiary
						text={t('skip')}
						testID="SkipButton"
						onPress={onHeaderButton}
					/>
				</Animated.View>
				<Animated.View
					style={[styles.headerButton, endOpacity]}
					pointerEvents={isLastSlide ? 'auto' : 'none'}>
					<ButtonTertiary
						text={t('advanced_setup')}
						testID="Passphrase"
						onPress={onHeaderButton}
					/>
				</Animated.View>
			</View>

			<Animated.View
				style={[styles.dots, startOpacity]}
				pointerEvents={isLastSlide ? 'none' : 'auto'}>
				{slides.map((_, i) => (
					<Dot
						key={i}
						index={i}
						animValue={progressValue}
						length={slides.length}
						onPress={(): void => scrollToSlide(i)}
					/>
				))}
			</Animated.View>
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
	headerButtons: {
		position: 'absolute',
		alignItems: 'flex-end',
		width: '100%',
	},
	headerButton: {
		position: 'absolute',
		bottom: -35,
		paddingHorizontal: 26,
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
		minHeight: 110,
	},
	note: {
		marginTop: 6,
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
