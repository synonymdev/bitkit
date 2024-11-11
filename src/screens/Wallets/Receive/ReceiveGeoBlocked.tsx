import React, { memo, ReactElement } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/buttons/Button';
import { useAppDispatch } from '../../../hooks/redux';
import { closeSheet } from '../../../store/slices/ui';
import { rootNavigation } from '../../../navigation/root/RootNavigator';
import type { ReceiveScreenProps } from '../../../navigation/types';
import { BodyM } from '../../../styles/text';

const imageSrc = require('../../../assets/illustrations/globe.png');

const ReceiveGeoBlocked =
	({}: ReceiveScreenProps<'ReceiveGeoBlocked'>): ReactElement => {
		const { t } = useTranslation('lightning');
		const dispatch = useAppDispatch();
		const handleManual = (): void => {
			dispatch(closeSheet('receiveNavigation'));
			rootNavigation.navigate('TransferRoot', { screen: 'FundingAdvanced' });
		};

		return (
			<GradientView style={styles.root}>
				<BottomSheetNavigationHeader
					title={t('wallet:receive_bitcoin')}
					displayBackButton={true}
				/>

				<View style={styles.content}>
					<BodyM color="white64">{t('funding.text_blocked_cjit')}</BodyM>

					<View style={styles.imageContainer}>
						<Image style={styles.image} source={imageSrc} />
					</View>

					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							size="large"
							text={t('funding_advanced.button2')}
							testID="Close"
							onPress={handleManual}
						/>
					</View>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</GradientView>
		);
	};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
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
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(ReceiveGeoBlocked);
