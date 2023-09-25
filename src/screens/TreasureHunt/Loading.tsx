import React, { ReactElement, memo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { getUniqueId, isEmulator } from 'react-native-device-info';
import { ldk } from '@synonymdev/react-native-ldk';
import { sha256 } from 'bitcoinjs-lib/src/crypto';

import { Subtitle, Text02M } from '../../styles/text';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import Title from './Title';
import { getNodeIdFromStorage } from '../../utils/lightning';
import { updateSettings } from '../../store/actions/settings';
import { useAppSelector } from '../../hooks/redux';
import { viewControllerSelector } from '../../store/reselect/ui';
import { __TREASURE_HUNT_HOST__ } from '../../constants/env';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import type { TreasureHuntScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/treasure-hunt/loading.jpg');

const Loading = ({
	navigation,
}: TreasureHuntScreenProps<'Loading'>): ReactElement => {
	const { chestId } = useSelector((state) => {
		return viewControllerSelector(state, 'treasureHunt');
	});
	const { treasureChests } = useAppSelector((state) => state.settings);
	const chest = treasureChests.find((c) => c.chestId === chestId);

	useEffect(() => {
		const openChest = async (): Promise<void> => {
			const nodePublicKey = getNodeIdFromStorage();
			const isSimulator = await isEmulator();
			let deviceId = nodePublicKey;

			if (!isSimulator) {
				// Device check is only available for physical devices
				const uniqueId = await getUniqueId();
				const buffer = Buffer.from(uniqueId, 'utf8');
				deviceId = sha256(buffer).toString('hex');
			}

			const input = {
				chestId,
				deviceId,
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
					const updated = {
						...chest,
						chestId: chestId!,
						state: 'opened' as const,
						attemptId: result.attemptId,
						winType: result.winType,
					};
					const newChests = treasureChests.map((c) => {
						return c !== chest ? c : updated;
					});

					updateSettings({ treasureChests: newChests });
				}

				navigation.replace('Prize');
			} else {
				navigation.replace('Error');
			}
		};

		setTimeout(openChest, 3000);

		// onMount
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<GradientView style={styles.container} image={imageSrc}>
			<View style={styles.logo} pointerEvents="none">
				<BitkitLogo height={32} width={90} />
			</View>
			<View style={styles.title}>
				<Title text="Treasure Chest" />
				{chest?.shortId && (
					<View style={styles.chestName}>
						<Subtitle>{chest.shortId}</Subtitle>
					</View>
				)}
			</View>
			<View style={styles.content}>
				<View style={styles.buttonContainer}>
					<Text02M color="yellow">Trying to Open...</Text02M>
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
		borderColor: '#FF6600',
		borderRadius: 48,
		height: 48,
		width: 48,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		top: 130,
		right: 80,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		justifyContent: 'center',
	},
	buttonContainer: {
		marginTop: 'auto',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
});

export default memo(Loading);
