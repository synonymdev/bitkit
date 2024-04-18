import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import Lottie from 'lottie-react-native';
import { ldk } from '@synonymdev/react-native-ldk';

import { Caption13M, Text01M } from '../../styles/text';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import Title from './Title';
import GradientText from './GradientText';
import { emptyPrize, prizes } from './prizes';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useScreenSize } from '../../hooks/screen';
import { useDisplayValues } from '../../hooks/displayValues';
import { useLightningMaxInboundCapacity } from '../../hooks/lightning';
import { getNodeIdFromStorage, waitForLdk } from '../../utils/lightning';
import { updateTreasureChest } from '../../store/slices/settings';
import { createLightningInvoice } from '../../store/utils/lightning';
import { __TREASURE_HUNT_HOST__ } from '../../constants/env';
import type { TreasureHuntScreenProps } from '../../navigation/types';

const confettiSrc = require('../../assets/lottie/confetti-yellow.json');

const lightningIcon = `
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

const Prize = ({
	navigation,
	route,
}: TreasureHuntScreenProps<'Prize'>): ReactElement => {
	const { chestId } = route.params;
	const interval = useRef<NodeJS.Timer>();
	const { isSmallScreen } = useScreenSize();
	const dispatch = useAppDispatch();
	const { treasureChests } = useAppSelector((state) => state.settings);
	const maxInboundCapacitySat = useLightningMaxInboundCapacity();

	const chests = treasureChests.filter((c) => !c.isAirdrop);
	const chest = chests.find((c) => c.chestId === chestId)!;
	const chestIndex = chests.indexOf(chest);

	const { attemptId, state, winType } = chest;
	const isPaid = state === 'success';

	let prize = emptyPrize;
	if (winType && winType !== 'empty') {
		prize = prizes[chestIndex].find((p) => p.winType === winType)!;
	}

	const dv = useDisplayValues(prize.amount);
	const isWinner = prize.winType === 'winning';

	const getLightningInvoice = useCallback(async (): Promise<string> => {
		const response = await createLightningInvoice({
			amountSats: 0,
			description: `Treasure Payout: ${prize.title}`,
			expiryDeltaSeconds: 3600,
		});

		if (response.isErr()) {
			console.log(response.error.message);
			return '';
		}

		return response.value.to_str;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (winType === 'empty') {
			return;
		}

		const claimPrize = async (): Promise<void> => {
			await waitForLdk();

			const invoice = await getLightningInvoice();
			const nodePublicKey = getNodeIdFromStorage();

			if (invoice) {
				const input = {
					attemptId,
					invoice,
					maxInboundCapacitySat,
					nodePublicKey,
				};
				const signResult = await ldk.nodeSign({
					message: JSON.stringify(input),
					messagePrefix: '',
				});
				if (signResult.isErr()) {
					navigation.replace('Error');
					return;
				}
				const signature = signResult.value;

				const response = await fetch(__TREASURE_HUNT_HOST__, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						method: 'grabTreasure',
						params: {
							input: {
								attemptId,
								invoice,
								maxInboundCapacitySat,
								nodePublicKey,
							},
							signature,
						},
					}),
				});

				const { result } = await response.json();

				if (result.error) {
					console.log(result.error);
					return;
				} else {
					dispatch(
						updateTreasureChest({
							chestId,
							attemptId,
							state: 'claimed',
						}),
					);
				}
			}
		};

		const checkPayment = async (): Promise<void> => {
			if (!attemptId) {
				return;
			}

			const response = await fetch(__TREASURE_HUNT_HOST__, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					method: 'poll',
					params: {
						input: { attemptId },
					},
				}),
			});

			const { result } = await response.json();

			if (result.error) {
				console.log(result.error);
				clearTimeout(interval.current);
				return;
			} else {
				if (result.state === 'INFLIGHT') {
					return;
				}

				clearTimeout(interval.current);

				dispatch(
					updateTreasureChest({
						chestId,
						state: result.state === 'SUCCESS' ? 'success' : 'failed',
					}),
				);

				if (result.state === 'FAILED') {
					navigation.replace('Error');
				}
			}
		};

		if (state === 'opened') {
			setTimeout(claimPrize, 10000);
		}

		if (state !== 'success' && state !== 'failed') {
			interval.current = setInterval(checkPayment, 20000);
		}

		// onMount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<GradientView style={styles.container} image={prize.image}>
			{isWinner && (
				<View style={styles.confetti} pointerEvents="none">
					<Lottie
						source={confettiSrc}
						style={styles.lottie}
						resizeMode="cover"
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
					<SvgXml xml={lightningIcon} width="30" height="100%" />
					<View style={styles.amountText}>
						<GradientText
							style={styles.amountTextSkia}
							text={dv.bitcoinFormatted}
						/>
					</View>
				</View>
				<Text01M style={styles.description} color="yellow">
					{prize.description}
				</Text01M>
				{/* eslint-disable-next-line react-native/no-inline-styles */}
				<View style={{ marginTop: isSmallScreen ? 40 : 80 }}>
					{prize.note ? (
						<Caption13M style={styles.noteText} color="yellow">
							{prize.note}
						</Caption13M>
					) : (
						<Caption13M style={styles.noteText} color="yellow">
							{isPaid ? (
								<Caption13M color="brand">
									You have already received your payout.{' '}
								</Caption13M>
							) : (
								<Caption13M color="yellow">
									The payout may take about a minute.{' '}
								</Caption13M>
							)}
							Each treasure chest you discover boosts the prize and odds of
							winning!
						</Caption13M>
					)}
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
	},
	lottie: {
		height: '100%',
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
		marginTop: 55,
	},
	amountText: {
		height: 48,
	},
	amountTextSkia: {
		flex: 1,
	},
	description: {
		marginTop: 'auto',
		textAlign: 'center',
	},
	noteText: {
		opacity: 0.6,
		textAlign: 'center',
	},
});

export default memo(Prize);
