import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useRef,
} from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import Lottie from 'lottie-react-native';

import { Caption13M, Text01M } from '../../styles/text';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import Title from './Title';
import GradientText from './GradientText';
import useDisplayValues from '../../hooks/displayValues';
import { EUnit } from '../../store/types/wallet';
import { prizes } from './prizes';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import type { TreasureHuntScreenProps } from '../../navigation/types';

const confettiSrc = require('../../assets/lottie/confetti-yellow.json');

const xml = `
  <svg width="14" height="16" viewBox="0 0 14 16">
	<path d="M0.74707 9.29991H4.51758L2.54346 14.5621C2.26416 15.2858 3.01953 15.673 3.50195 15.0826L9.58301 7.62413C9.69727 7.47813 9.76074 7.33848 9.76074 7.17979C9.76074 6.9005 9.54492 6.69737 9.25293 6.69737H5.48242L7.45654 1.43516C7.72949 0.711532 6.98047 0.330672 6.49805 0.914657L0.416992 8.37315C0.296387 8.51915 0.239258 8.6588 0.239258 8.81749C0.239258 9.09679 0.455078 9.29991 0.74707 9.29991Z" fill="url(#gradient)" />
    <defs>
		<linearGradient
			id="gradient"
			x1="0"
			y1="0"
			x2="8.46631"
			y2="37.3364"
			gradient-units="userSpaceOnUse">
			<stop offset="0" stop-color="#FF6600" />
			<stop offset="0.4" stop-color="#FFD200" />
      	</linearGradient>
    </defs>
  </svg>
`;

const Prize = ({ route }: TreasureHuntScreenProps<'Prize'>): ReactElement => {
	const { id } = route.params;
	const animationRef = useRef<Lottie>(null);
	const appState = useRef(AppState.currentState);

	const prize = prizes.find((p) => p.id === id)!;

	const dv = useDisplayValues(prize.amount, EUnit.satoshi);
	const isWinner = prize.amount > 9999;

	// TEMP: fix iOS animation autoPlay
	// @see https://github.com/lottie-react-native/lottie-react-native/issues/832
	useFocusEffect(
		useCallback(() => {
			if (Platform.OS === 'ios') {
				animationRef.current?.reset();
				setTimeout(() => {
					animationRef.current?.play();
				}, 0);
			}
		}, []),
	);

	// TEMP: fix iOS animation on app to foreground
	useEffect(() => {
		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState) => {
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					animationRef.current?.play();
				}

				appState.current = nextAppState;
			},
		);

		return () => {
			appStateSubscription.remove();
		};
	}, []);

	return (
		<GradientView style={styles.container} image={prize.image}>
			{isWinner && (
				<View style={styles.confetti} pointerEvents="none">
					<Lottie
						ref={animationRef}
						onLayout={(_): void => animationRef.current?.play()}
						source={confettiSrc}
						autoPlay
						loop
					/>
				</View>
			)}
			<View style={styles.logo} pointerEvents="none">
				<BitkitLogo height={32} width={90} />
			</View>
			<Title text={prize.title} />
			<View style={styles.content}>
				<View style={styles.amount}>
					<SvgXml xml={xml} width="30" height="100%" />
					<View style={styles.amountText}>
						<GradientText
							style={styles.amountTextSkia}
							text={dv.bitcoinFormatted}
						/>
					</View>
				</View>
				<Text01M style={styles.chestDescription}>{prize.description}</Text01M>
				<View style={styles.note}>
					<Caption13M style={styles.noteText}>
						The payout may take about a minute. For every chest you find, the
						prize and chance of winning increases!
					</Caption13M>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	confetti: {
		...StyleSheet.absoluteFillObject,
		// fix Android confetti height
		...Platform.select({
			android: {
				width: '180%',
			},
		}),
		// zIndex: 1,
	},
	logo: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	content: {
		flex: 1.3,
		paddingHorizontal: 16,
		justifyContent: 'center',
		zIndex: 2,
	},
	amount: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 50,
	},
	amountText: {
		height: 48,
	},
	amountTextSkia: {
		flex: 1,
	},
	chestDescription: {
		marginTop: 'auto',
		color: '#FFD200',
		textAlign: 'center',
	},
	note: {
		marginTop: 80,
	},
	noteText: {
		color: '#FFD200',
		opacity: 0.6,
		textAlign: 'center',
	},
});

export default memo(Prize);
