import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { updateUser } from '../../store/actions/user';
import { useSelectedSlashtag } from '../../hooks/slashtags';
import { StyleSheet, View, Image } from 'react-native';
import GlowingBackground from '../../components/GlowingBackground';
import { Display, Text01S } from '../../styles/components';
import Button from '../../components/Button';
import LoadingWalletScreen from './Loading';
import useColors from '../../hooks/colors';
import Glow from '../../components/Glow';
import { restoreRemoteBackups } from '../../utils/startup';
import { Result } from '@synonymdev/result';

const imageSrc = require('../../assets/illustrations/check.png');

let attemptedAutoRestore = false;

const RestoringScreen = (): ReactElement => {
	const [showRestored, setShowRestored] = useState(false);
	const [showFailed, setShowFailed] = useState(false);

	const { green, red } = useColors();
	const slashtag = useSelectedSlashtag();

	const onRemoteRestore = useCallback(async (): Promise<void> => {
		attemptedAutoRestore = true;
		setShowFailed(false);
		setShowRestored(false);

		const res = await restoreRemoteBackups(slashtag.slashtag);
		if (res.isErr()) {
			return setShowFailed(true);
		}

		setShowRestored(true);
	}, [slashtag]);

	useEffect(() => {
		if (attemptedAutoRestore) {
			return;
		}

		(async (): Promise<void> => {
			await onRemoteRestore();
		})();
	}, [onRemoteRestore]);

	if (showRestored || showFailed) {
		const color = showRestored ? green : red;
		const title = showRestored ? 'Wallet Restored.' : 'Failed to restore.';
		const subtitle = showRestored
			? 'You have successfully restored your wallet from backup. Enjoy Bitkit!'
			: 'Failed to recover backed up data.';
		const onPress = showRestored
			? (): Result<string> => updateUser({ requiresRemoteRestore: false }) //App.tsx will show wallet now
			: (): Promise<void> => onRemoteRestore().then().catch(console.error);
		const buttonText = showRestored ? 'Get Started' : 'Try Again';

		return (
			<GlowingBackground topLeft={color}>
				<View style={styles.contentResult}>
					<View>
						<Display style={styles.title}>{title}</Display>
						<Text01S color="white8">{subtitle}</Text01S>
					</View>

					<View style={styles.imageContainer} pointerEvents="none">
						<View style={styles.canvasContainer}>
							<Glow color={color} />
						</View>
						<Image style={styles.image} source={imageSrc} />
					</View>

					<View>
						<Button onPress={onPress} size="large" text={buttonText} />
					</View>
				</View>
			</GlowingBackground>
		);
	}

	//Busy restoring
	return (
		<GlowingBackground topLeft={green}>
			<LoadingWalletScreen />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	title: {
		marginBottom: 8,
	},
	contentResult: {
		paddingHorizontal: 48,
		paddingTop: 120,
		paddingBottom: 120,
		flex: 1,
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		marginHorizontal: -50,
	},
	image: {
		width: 200,
		height: 200,
	},
	canvasContainer: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},
});

export default RestoringScreen;
