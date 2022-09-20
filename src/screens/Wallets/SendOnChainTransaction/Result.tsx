import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';

import {
	View as ThemedView,
	Subtitle,
	Text01S,
} from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { toggleView } from '../../../store/actions/user';

const Result = ({ navigation, route }): ReactElement => {
	const { success = true, errorTitle, errorMessage } = route.params;
	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const source = success
		? require('../../../assets/illustrations/check.png')
		: require('../../../assets/illustrations/cross.png');

	const handleButtonPress = (): void => {
		if (success) {
			toggleView({
				view: 'sendNavigation',
				data: {
					isOpen: false,
				},
			});
		} else {
			navigation.navigate('ReviewAndSend');
		}
	};

	return (
		<ThemedView color="onSurface" style={styles.container}>
			{success && (
				<Lottie
					source={require('../../../assets/lottie/confetti-green.json')}
					autoPlay
					loop
				/>
			)}
			{success ? (
				<BottomSheetNavigationHeader
					title="Bitcoin Sent"
					displayBackButton={false}
				/>
			) : (
				<BottomSheetNavigationHeader title="Transaction Failed" />
			)}

			<View style={styles.error}>
				{errorTitle && (
					<Subtitle style={styles.errorTitle} color="red">
						{errorTitle}
					</Subtitle>
				)}
				{errorMessage && <Text01S color="red">{errorMessage}</Text01S>}
			</View>

			<View style={styles.imageContainer}>
				<Glow
					style={styles.glow}
					size={600}
					color={success ? 'green' : 'red'}
				/>
				<Image source={source} style={styles.image} />
			</View>

			<View style={nextButtonContainer}>
				<Button
					size="large"
					text={success ? 'Close' : 'Try Again'}
					onPress={handleButtonPress}
				/>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	error: {
		marginHorizontal: 32,
	},
	errorTitle: {
		marginBottom: 8,
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
		paddingHorizontal: 16,
		width: '100%',
	},
});

export default memo(Result);
