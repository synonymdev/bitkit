import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Image, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Switch, Text01S, Text01M } from '../../../styles/components';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { toggleView } from '../../../store/actions/user';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';
import type { PinScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/check.png');

const Result = ({ route }: PinScreenProps<'Result'>): ReactElement => {
	const { bio } = route.params;
	const insets = useSafeAreaInsets();
	const pinForPayments = useSelector(
		(state: Store) => state.settings.pinForPayments,
	);

	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const handleTogglePress = (): void => {
		updateSettings({ pinForPayments: !pinForPayments });
	};

	const handleButtonPress = (): void => {
		toggleView({
			view: 'PINNavigation',
			data: { isOpen: false },
		});
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title="Wallet Secured"
				displayBackButton={false}
			/>

			<View style={styles.message}>
				{bio ? (
					<Text01S color="gray1">
						You have successfully set up a PIN code and biometrics to improve
						your wallet security.
					</Text01S>
				) : (
					<Text01S color="gray1">
						You have successfully set up a PIN code to improve your wallet
						security.
					</Text01S>
				)}
			</View>

			<View style={styles.imageContainer} pointerEvents="none">
				<Glow style={styles.glow} size={600} color="green" />
				<Image source={imageSrc} style={styles.image} />
			</View>

			<Pressable style={styles.toggle} onPress={handleTogglePress}>
				<Text01M>Also require for payments</Text01M>
				<Switch onValueChange={handleTogglePress} value={pinForPayments} />
			</Pressable>

			<View style={nextButtonContainer}>
				<Button size="large" text="OK" onPress={handleButtonPress} />
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	message: {
		marginHorizontal: 32,
		alignSelf: 'flex-start',
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: 200,
		height: 200,
	},
	glow: {
		position: 'absolute',
	},
	toggle: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 32,
		marginBottom: 32,
	},
	nextButtonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
		width: '100%',
	},
});

export default memo(Result);
