import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import { toggleView } from '../../store/actions/ui';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const imageSrc = require('../../assets/illustrations/switch.png');

const CloseChannelSuccess = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();

	useBottomSheetBackPress('backupPrompt');

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const onContinue = (): void => {
		toggleView({
			view: 'closeChannelSuccess',
			data: { isOpen: false },
		});
	};

	return (
		<BottomSheetWrapper
			view="closeChannelSuccess"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title="Connection closed"
					displayBackButton={false}
				/>
				<Text01S color="white5">
					Part of your instant balance has been moved to your savings because a
					Lightning connection has closed.
				</Text01S>
				<GlowImage image={imageSrc} imageSize={170} glowColor="red" />
				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						text="OK"
						size="large"
						onPress={onContinue}
					/>
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginHorizontal: 32,
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
});

export default memo(CloseChannelSuccess);
