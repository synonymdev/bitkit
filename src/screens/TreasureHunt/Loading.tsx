import React, { ReactElement, memo, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ldk } from '@synonymdev/react-native-ldk';

import { Subtitle, BodySSB } from '../../styles/text';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import Title from './Title';
import { getNodeIdFromStorage, waitForLdk } from '../../utils/lightning';
import { updateTreasureChest } from '../../store/slices/settings';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useScreenSize } from '../../hooks/screen';
import { __TREASURE_HUNT_HOST__ } from '../../constants/env';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import type { TreasureHuntScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/treasure-hunt/loading.jpg');

const Loading = ({
	navigation,
	route,
}: TreasureHuntScreenProps<'Loading'>): ReactElement => {
	const { chestId } = route.params;
	const { isSmallScreen } = useScreenSize();
	const dispatch = useAppDispatch();
	const { treasureChests } = useAppSelector((state) => state.settings);
	const chest = treasureChests.find((c) => c.chestId === chestId);

	const chestNameStyle = {
		top: isSmallScreen ? 100 : 126,
		right: isSmallScreen ? 90 : 80,
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: onMount
	useEffect(() => {
		const openChest = async (): Promise<void> => {
			await waitForLdk();

			const nodePublicKey = getNodeIdFromStorage();
			const input = { chestId, nodePublicKey };
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
					method: 'openChest',
					params: {
						input,
						signature,
					},
				}),
			});

			const { result } = await response.json();

			const hasOpened = chest?.state !== 'found' || result.code === 5000;

			if (!result.error || hasOpened) {
				if (!result.error) {
					dispatch(
						updateTreasureChest({
							chestId,
							state: 'opened',
							attemptId: result.attemptId,
							winType: result.winType,
						}),
					);
				}

				navigation.replace('Prize', { chestId });
			} else {
				navigation.replace('Error');
			}
		};

		setTimeout(openChest, 3000);
	}, []);

	return (
		<GradientView style={styles.container} image={imageSrc}>
			<View style={styles.logo} pointerEvents="none">
				<BitkitLogo height={32} width={90} />
			</View>
			<View style={styles.title}>
				<Title text="Treasure Chest" indent={15} />
				{chest?.shortId && (
					<View style={[styles.chestName, chestNameStyle]}>
						<Subtitle>{chest.shortId}</Subtitle>
					</View>
				)}
			</View>
			<View style={styles.content}>
				<View style={styles.footer}>
					<ActivityIndicator color="white" />
					<View style={styles.loadingText}>
						<BodySSB color="yellow">Trying To Open...</BodySSB>
					</View>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
	},
	logo: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	title: {
		flex: 1,
	},
	chestName: {
		backgroundColor: 'black',
		borderWidth: 4,
		borderColor: '#FF4400',
		borderRadius: 48,
		height: 48,
		width: 48,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		top: 127,
		right: 80,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		justifyContent: 'center',
	},
	footer: {
		marginTop: 'auto',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	loadingText: {
		height: 56,
		justifyContent: 'center',
		marginTop: 8,
	},
});

export default memo(Loading);
