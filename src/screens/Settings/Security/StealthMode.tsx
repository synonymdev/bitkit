import React, { memo, ReactElement, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeIcon } from '@synonymdev/react-native-change-icon';

import { BodyM } from '../../../styles/text';
import GradientBackground from '../../../components/GradientBackground';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { EItemType, IListData, ItemData } from '../../../components/List';
import Button from '../../../components/buttons/Button';
import SettingsView from './../SettingsView';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { appIcon } from '../../../constants/app';
import { showBottomSheet } from '../../../store/utils/ui';
import { updateSettings } from '../../../store/slices/settings';
import {
	enableStealthModeSelector,
	pinSelector,
} from '../../../store/reselect/settings';

const imageSrc = require('../../../assets/illustrations/stealth-mode.png');

const StealthMode = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const hasPin = useAppSelector(pinSelector);
	const enabled = useAppSelector(enableStealthModeSelector);

	const listData: IListData[] = useMemo(() => {
		const onToggle = async (): Promise<void> => {
			const iconName = enabled ? appIcon.default : appIcon.calculator;

			try {
				dispatch(updateSettings({ enableStealthMode: !enabled }));
				await changeIcon(iconName);
			} catch (error) {
				console.error(error);
			}
		};

		const data: ItemData[] = [
			{
				title: t('stealth_mode.toggle'),
				type: EItemType.switch,
				disabled: !hasPin,
				enabled,
				testID: 'ToggleStealthMode',
				onPress: onToggle,
			},
		];

		return [{ data }];
	}, [enabled, hasPin, dispatch, t]);

	const onPress = (): void => {
		showBottomSheet('PINNavigation', { showLaterButton: false });
	};

	const description = hasPin
		? t('stealth_mode.description.enabled')
		: t('stealth_mode.description.disabled');

	return (
		<GradientBackground style={styles.root}>
			<SettingsView
				title={t('stealth_mode.nav_title')}
				listData={listData}
				fullHeight={false}
			/>

			<View style={styles.description}>
				<BodyM color="secondary">{description}</BodyM>
			</View>

			<View style={styles.imageContainer}>
				<Image style={styles.image} source={imageSrc} />
			</View>

			{!hasPin && (
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('stealth_mode.button')}
						size="large"
						onPress={onPress}
					/>
				</View>
			)}

			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	description: {
		paddingHorizontal: 16,
		paddingVertical: 16,
		marginBottom: 64,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(StealthMode);
