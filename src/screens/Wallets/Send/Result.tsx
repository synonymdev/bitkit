import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';

import { Subtitle, Text01S } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { toggleView } from '../../../store/actions/user';
import type { SendScreenProps } from '../../../navigation/types';

const confettiSrc = require('../../../assets/lottie/confetti-green.json');

const Result = ({
	navigation,
	route,
}: SendScreenProps<'Result'>): ReactElement => {
	const { success = true, errorTitle, errorMessage } = route.params;
	const insets = useSafeAreaInsets();
	const buttonContainer = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const source = success
		? require('../../../assets/illustrations/check.png')
		: require('../../../assets/illustrations/cross.png');

	const navigateToTxDetails = (): void => {
		navigation.navigate('ReviewAndSend');
	};

	const navigateToSend = (): void => {
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
		<GradientView style={styles.container}>
			<>{success && <Lottie source={confettiSrc} autoPlay loop />}</>

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

			<View style={styles.imageContainer} pointerEvents="none">
				<Glow
					style={styles.glow}
					size={600}
					color={success ? 'green' : 'red'}
				/>
				<Image source={source} style={styles.image} />
			</View>

			<View style={buttonContainer}>
				{success && (
					<>
						<Button
							style={styles.button1}
							variant="secondary"
							size="large"
							text="Transaction Details"
							onPress={navigateToTxDetails}
						/>
						<View style={styles.divider} />
					</>
				)}
				<Button
					style={styles.button2}
					size="large"
					text={success ? 'Close' : 'Try Again'}
					onPress={navigateToSend}
				/>
			</View>
		</GradientView>
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
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingHorizontal: 16,
		marginTop: 'auto',
	},
	button1: {
		flex: 2,
	},
	button2: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(Result);
