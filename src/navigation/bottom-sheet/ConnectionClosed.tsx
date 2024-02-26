import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text01S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { closeSheet } from '../../store/slices/ui';
import { useAppDispatch } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const imageSrc = require('../../assets/illustrations/switch.png');

const ConnectionClosed = (): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();
	const snapPoints = useSnapPoints('medium');

	useBottomSheetBackPress('backupPrompt');

	const onContinue = (): void => {
		dispatch(closeSheet('connectionClosed'));
	};

	return (
		<BottomSheetWrapper
			view="connectionClosed"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('connection_closed.title')}
					displayBackButton={false}
				/>
				<Text01S color="white50">{t('connection_closed.description')}</Text01S>
				<GlowImage image={imageSrc} imageSize={170} glowColor="red" />
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('ok')}
						size="large"
						onPress={onContinue}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
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

export default memo(ConnectionClosed);
