import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { useAppDispatch } from '../../hooks/redux';
import { closeSheet } from '../../store/slices/ui';
import { BodyM } from '../../styles/text';

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
		<BottomSheetWrapper view="connectionClosed" snapPoints={snapPoints}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('connection_closed.title')}
					showBackButton={false}
				/>
				<BodyM color="secondary">{t('connection_closed.description')}</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

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
		marginHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
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
