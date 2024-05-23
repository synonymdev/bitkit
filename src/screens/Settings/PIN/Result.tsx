import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Switch } from '../../../styles/components';
import { BodyM, BodyMSB } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { closeSheet } from '../../../store/slices/ui';
import { updateSettings } from '../../../store/slices/settings';
import { pinForPaymentsSelector } from '../../../store/reselect/settings';
import type { PinScreenProps } from '../../../navigation/types';
import { Image } from 'react-native';

const imageSrc = require('../../../assets/illustrations/check.png');

const Result = ({ route }: PinScreenProps<'Result'>): ReactElement => {
	const { bio, type } = route.params;
	const { t } = useTranslation('security');
	const dispatch = useAppDispatch();
	const pinForPayments = useAppSelector(pinForPaymentsSelector);

	const biometricsName = useMemo(
		() =>
			type === 'TouchID'
				? t('bio_touch_id')
				: type === 'FaceID'
				? t('bio_face_id')
				: type ?? t('bio'),
		[type, t],
	);

	const handleTogglePress = (): void => {
		dispatch(updateSettings({ pinForPayments: !pinForPayments }));
	};

	const handleButtonPress = (): void => {
		dispatch(closeSheet('PINNavigation'));
	};

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader
				title={t('success_title')}
				displayBackButton={false}
			/>

			<View style={styles.content}>
				{bio ? (
					<BodyM color="secondary">
						{t('success_bio', { biometricsName })}
					</BodyM>
				) : (
					<BodyM color="secondary">{t('success_no_bio')}</BodyM>
				)}

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<Pressable
					style={styles.toggle}
					testID="ToggleBioForPayments"
					onPress={handleTogglePress}>
					<BodyMSB>{t('success_payments')}</BodyMSB>
					<Switch value={pinForPayments} onValueChange={handleTogglePress} />
				</Pressable>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						text={t('ok')}
						testID="OK"
						onPress={handleButtonPress}
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
		paddingHorizontal: 32,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
		marginBottom: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	toggle: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 'auto',
		marginBottom: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 16,
	},
	button: {
		paddingHorizontal: 16,
		flex: 1,
	},
});

export default memo(Result);
