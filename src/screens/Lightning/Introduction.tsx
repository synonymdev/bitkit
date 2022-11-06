import React, { ReactElement, useMemo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { Display, Text01S, View } from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import useColors from '../../hooks/colors';
import type { LightningScreenProps } from '../../navigation/types';
import Store from '../../store/types';
import { useBalance } from '../../hooks/wallet';
import { ETransactionDefaults } from '../../store/types/wallet';

const imageSrc = require('../../assets/illustrations/lightning.png');

const Introduction = ({
	navigation,
}: LightningScreenProps<'Introduction'>): ReactElement => {
	const isGeoBlocked = useSelector(
		(state: Store) => state.user?.isGeoBlocked ?? false,
	);
	const balance = useBalance({ onchain: true });
	const colors = useColors();

	const txt = useMemo(() => {
		if (isGeoBlocked) {
			return (
				'Open a Lightning connection and \nsend or receive bitcoin instantly.\n\n' +
				'Unfortunately, Bitkit cannot provide automatic Lightning connections to residents of the United States (yet).'
			);
		} else {
			return 'Open a Lightning connection and \nsend or receive bitcoin instantly.';
		}
	}, [isGeoBlocked]);

	const isDisabled = useMemo(() => {
		return balance.satoshis <= ETransactionDefaults.recommendedBaseFee;
	}, [balance.satoshis]);

	return (
		<GlowingBackground topLeft={colors.purple}>
			<View color="transparent" style={styles.slide}>
				<SafeAreaInsets type="top" />
				<NavigationHeader
					onClosePress={(): void => {
						navigation.navigate('Tabs');
					}}
				/>
				<View color="transparent" style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View color="transparent" style={styles.textContent}>
					<Display>
						Instant <Display color="purple">Payments.</Display>
					</Display>
					<Text01S color="gray1" style={styles.text}>
						{txt}
					</Text01S>
				</View>

				<View color="transparent" style={styles.buttonContainer}>
					{!isGeoBlocked && (
						<>
							<Button
								text="Quick Setup"
								size="large"
								style={[styles.button, styles.quickButton]}
								disabled={isDisabled}
								onPress={(): void => {
									navigation.navigate('QuickSetup');
								}}
							/>

							<Button
								text="Custom Setup"
								size="large"
								variant="secondary"
								style={[styles.button, styles.customButton]}
								disabled={isDisabled}
								onPress={(): void => {
									navigation.navigate('CustomSetup', { spending: true });
								}}
							/>
						</>
					)}
				</View>
				<SafeAreaInsets type="bottom" />
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	slide: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'stretch',
		marginBottom: 16,
	},
	imageContainer: {
		flex: 4,
		alignItems: 'center',
		paddingVertical: 50,
		justifyContent: 'flex-end',
		width: '100%',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	textContent: {
		flex: 3,
		paddingHorizontal: 22,
	},
	text: {
		marginTop: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		marginHorizontal: 16,
	},
	button: {
		flex: 1,
	},
	quickButton: {
		marginRight: 6,
	},
	customButton: {
		marginLeft: 6,
	},
});

export default Introduction;
