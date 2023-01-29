import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../../styles/text';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { toggleView } from '../../../store/actions/ui';
import { useAppSelector } from '../../../hooks/redux';
import { showLaterButtonSelector } from '../../../store/reselect/ui';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../../hooks/bottomSheet';

const imageSrc = require('../../../assets/illustrations/shield.png');

const PINPrompt = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();
	const showLaterButton = useAppSelector(showLaterButtonSelector);

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

				<GlowImage image={imageSrc} imageSize={150} glowColor="green" />

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
						testID="SecureWallet"
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
