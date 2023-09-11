import React, { ReactElement, memo } from 'react';
import { StyleSheet, Platform, View, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { Text02M } from '../../styles/text';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import BlurView from '../../components/BlurView';
import { useLightningBalance } from '../../hooks/lightning';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';
import { viewControllerSelector } from '../../store/reselect/ui';
import GradientText from './GradientText';
import Title from './Title';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import type { TreasureHuntScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/treasure-hunt/treasure.jpg');

const Chest = ({
	navigation,
}: TreasureHuntScreenProps<'Chest'>): ReactElement => {
	const { remoteBalance } = useLightningBalance(false);
	const { id } = useSelector((state) => {
		return viewControllerSelector(state, 'treasureHunt');
	});

	useBottomSheetBackPress('treasureHunt');

	console.log({ id });
	console.log({ remoteBalance });

	return (
		<GradientView style={styles.container} image={imageSrc}>
			<View style={styles.logo} pointerEvents="none">
				<BitkitLogo height={32} width={90} />
			</View>
			<Title text="Treasure Chest" />
			<View style={styles.content}>
				<View style={styles.chestNumber}>
					<GradientText style={styles.chestNumberText} text="1/6" />
				</View>
				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={styles.button}
						activeOpacity={0.8}
						onPress={(): void =>
							navigation.navigate('Prize', {
								id: Math.floor(Math.random() * 14) + 1,
							})
						}>
						<BlurView style={styles.buttonBlur}>
							<Text02M style={styles.buttonText}>Try To Open</Text02M>
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
	},
	logo: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		justifyContent: 'center',
	},
	chestNumber: {
		flex: 1,
		alignItems: 'center',
		marginTop: 30,
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
