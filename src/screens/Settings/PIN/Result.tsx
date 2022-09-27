import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../../styles/components';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { toggleView } from '../../../store/actions/user';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';

const imageSrc = require('../../../assets/illustrations/check.png');

const Result = ({ route }): ReactElement => {
	const { bio } = route?.params;
	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

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

			<View style={styles.imageContainer}>
				<Glow style={styles.glow} size={600} color="green" />
				<Image source={imageSrc} style={styles.image} />
			</View>

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
	nextButtonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
		width: '100%',
	},
});

export default memo(Result);
