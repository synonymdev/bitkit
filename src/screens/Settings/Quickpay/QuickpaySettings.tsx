import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet } from 'react-native';

import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Slider from '../../../components/Slider';
import SwitchRow from '../../../components/SwitchRow';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
	enableQuickpaySelector,
	quickpayAmountSelector,
} from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/slices/settings';
import { View as ThemedView, View } from '../../../styles/components';
import { BodyM, BodyS, Caption13Up } from '../../../styles/text';

const imageSrc = require('../../../assets/illustrations/fast-forward.png');

const QuickpaySettings = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const enabledQuickpay = useAppSelector(enableQuickpaySelector);
	const amount = useAppSelector(quickpayAmountSelector);

	const sliderSteps = useMemo(() => [1, 5, 10, 20, 50], []);

	const onToggle = (): void => {
		dispatch(updateSettings({ enableQuickpay: !enabledQuickpay }));
	};

	const onChange = (value: number): void => {
		dispatch(updateSettings({ quickpayAmount: value }));
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('quickpay.nav_title')} />

			<View style={styles.content}>
				<SwitchRow
					style={styles.switch}
					isEnabled={enabledQuickpay}
					testID="QuickpayToggle"
					onPress={onToggle}>
					<BodyM>{t('quickpay.settings.toggle')}</BodyM>
				</SwitchRow>

				<BodyM style={styles.text} color="secondary">
					{t('quickpay.settings.text', { amount })}
				</BodyM>

				<View style={styles.sliderContainer}>
					<Caption13Up color="secondary">
						{t('quickpay.settings.label')}
					</Caption13Up>
					<Slider value={amount} steps={sliderSteps} onValueChange={onChange} />
				</View>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<BodyS color="secondary">{t('quickpay.settings.note')}</BodyS>
			</View>

			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	switch: {
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	text: {
		marginTop: 16,
	},
	sliderContainer: {
		marginTop: 32,
	},
	imageContainer: {
		flexShrink: 1,
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
});

export default memo(QuickpaySettings);
