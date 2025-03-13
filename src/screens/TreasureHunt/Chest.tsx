import React, { ReactElement, memo, useCallback } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '../../hooks/redux';

import BitkitLogo from '../../assets/bitkit-logo.svg';
import BlurView from '../../components/BlurView';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useScreenSize } from '../../hooks/screen';
import { BodySSB, Subtitle } from '../../styles/text';
import GradientText from './GradientText';
import Title from './Title';

import type { TreasureHuntScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/treasure-hunt/treasure.jpg');

const Chest = ({
	navigation,
	route,
}: TreasureHuntScreenProps<'Chest'>): ReactElement => {
	const { chestId } = route.params;
	const { isSmallScreen } = useScreenSize();
	const { treasureChests } = useAppSelector((state) => state.settings);

	const chests = treasureChests.filter((c) => !c.isAirdrop);
	const chest = chests.find((c) => c.chestId === chestId)!;
	const chestIndex = chest ? chests.indexOf(chest) : treasureChests.length;

	const chestNameStyle = {
		top: isSmallScreen ? 100 : 126,
		right: isSmallScreen ? 90 : 80,
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: onMount
	const onOpen = useCallback(async () => {
		if (chestId) {
			const hasFailed = chest?.state === 'failed';
			const hasOpened = ['opened', 'claimed', 'success'].includes(
				chest?.state!,
			);

			if (hasFailed) {
				navigation.replace('Error');
			} else if (hasOpened) {
				navigation.replace('Prize', { chestId });
			} else {
				navigation.replace('Loading', { chestId });
			}
		}
	}, [chestId]);

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
				<View style={styles.chestNumber}>
					<GradientText
						style={styles.chestNumberText}
						text={`${chestIndex + 1}/6`}
					/>
				</View>
				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={styles.button}
						activeOpacity={0.8}
						onPress={onOpen}>
						<BlurView style={styles.buttonBlur}>
							<BodySSB style={styles.buttonText}>Try To Open</BodySSB>
						</BlurView>
					</TouchableOpacity>
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
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		justifyContent: 'center',
	},
	chestNumber: {
		flex: 1,
		alignItems: 'center',
		marginTop: 20,
	},
	chestNumberText: {
		flex: 1,
	},
	buttonContainer: {
		marginTop: 'auto',
		justifyContent: 'flex-end',
	},
	button: {
		height: 56,
		width: '100%',
		shadowColor: 'black',
		shadowOpacity: 0.8,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 13 },
	},
	buttonBlur: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		borderRadius: 30,
		borderWidth: 1,
		borderColor: '#FFD200',
		elevation: 6,
		...Platform.select({
			android: {
				backgroundColor: 'rgba(0, 0, 0, 0.8)',
			},
		}),
	},
	buttonText: {
		color: '#FFD200',
	},
});

export default memo(Chest);
