import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, Image, View } from 'react-native';

import { Subtitle, Text01S } from '../../../styles/components';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import Glow from '../../../components/Glow';
import Button from '../../../components/Button';
import { toggleView } from '../../../store/actions/user';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

const PINPrompt = (): ReactElement => {
	const snapPoints = useMemo(() => [450], []);

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
			<View style={styles.root}>
				<Subtitle style={styles.title}>Increase security</Subtitle>
				<Text01S color="white5">
					To increase wallet security, you can set up a PIN code and Face ID.
				</Text01S>
				<View style={styles.imageContainer}>
					<Glow color="green" size={500} style={styles.glow} />
					<Image
						style={styles.image}
						resizeMode="contain"
						source={require('../../../assets/illustrations/shield.png')}
					/>
				</View>
				<View style={styles.buttons}>
					<Button
						style={styles.button}
						size="lg"
						variant="secondary"
						text="Later"
						onPress={handleLater}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="lg"
						text="Secure Wallet"
						onPress={handlePIN}
					/>
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		alignItems: 'center',
		flex: 1,
		paddingHorizontal: 32,
	},
	title: {
		marginBottom: 25,
	},
	imageContainer: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		height: 210,
		width: 210,
	},
	image: {
		width: 150,
		height: 150,
	},
	glow: {
		position: 'absolute',
	},
	buttons: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
	divider: {
		flex: 0.3,
	},
});

export default memo(PINPrompt);
