import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text01S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import GlowImage from '../../components/GlowImage';
import { closeSheet } from '../../store/slices/ui';
import { useAppDispatch } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const imageSrc = require('../../assets/illustrations/keyring.png');

const SlashAuthWarning = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const dispatch = useAppDispatch();

	useBottomSheetBackPress('slashauthWarning');

	const onContinue = (): void => {
		dispatch(closeSheet('slashauthWarning'));
	};

	return (
		<BottomSheetWrapper view="slashauthWarning" snapPoints={snapPoints}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title="Caution"
					displayBackButton={false}
				/>

				<Text01S color="gray1">
					Signing in with Bitkit Auth will be disabled soon. Please set up a new
					account using LNURL-auth and transfer your funds or data to the new
					account.
				</Text01S>

				<GlowImage image={imageSrc} imageSize={205} glowColor="yellow" />

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						text="Understood"
						onPress={onContinue}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default memo(SlashAuthWarning);
