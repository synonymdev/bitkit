import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../../styles/components';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import Glow from '../../../components/Glow';
import Button from '../../../components/Button';
import { toggleView } from '../../../store/actions/user';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../../hooks/bottomSheet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Store from '../../../store/types';

const imageSrc = require('../../../assets/illustrations/shield.png');

const PINPrompt = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();
	const showLaterButton = useSelector(
		(store: Store) => store.user.viewController.PINPrompt.showLaterButton,
	);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('PINPrompt');

	const handlePIN = (): void => {
		toggleView({
			view: 'PINPrompt',
			data: { isOpen: false },
		});
		toggleView({
			view: 'PINNavigation',
			data: { isOpen: true },
		});
	};

	const handleLater = (): void => {
		toggleView({
			view: 'PINPrompt',
			data: { isOpen: false },
		});
	};

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleLater}
			view="PINPrompt">
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title="Increase Security"
					displayBackButton={false}
				/>
				<Text01S color="white5">
					To increase wallet security, you can set up a PIN code and Face ID to
					unlock your wallet.
				</Text01S>
				<View style={styles.imageContainer}>
					<Glow color="green" style={styles.glow} />
					<Image style={styles.image} resizeMode="contain" source={imageSrc} />
				</View>
				<View style={buttonContainerStyles}>
					{showLaterButton && (
						<>
							<Button
								style={styles.button}
								size="large"
								variant="secondary"
								text="Later"
								onPress={handleLater}
							/>
							<View style={styles.divider} />
						</>
					)}
					<Button
						style={styles.button}
						size="large"
						text="Secure Wallet"
						onPress={handlePIN}
					/>
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		paddingHorizontal: 32,
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: {
		width: 150,
		height: 150,
	},
	glow: {
		position: 'absolute',
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(PINPrompt);
