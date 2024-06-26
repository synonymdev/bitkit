import React, { memo, ReactElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { changeIcon } from 'react-native-change-icon';

import { AppIcon, Checkmark } from '../../../styles/icons';
import {
	View as ThemedView,
	TouchableOpacity,
} from '../../../styles/components';
import { Caption13Up, BodyM, BodyS } from '../../../styles/text';
import SafeAreaInset from '../../../components/SafeAreaInset';
import NavigationHeader from '../../../components/NavigationHeader';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { EAppIcon } from '../../../store/types/settings';
import { updateSettings } from '../../../store/slices/settings';
import { appIconSelector } from '../../../store/reselect/settings';
import type { SettingsScreenProps } from '../../../navigation/types';

type AppIcon = {
	id: EAppIcon;
	name: string;
	color: string;
};

const orangeName = Platform.OS === 'ios' ? 'Default' : 'Orange';
const blackName = Platform.OS === 'ios' ? 'AppIconBlack' : 'Black';

const icons: AppIcon[] = [
	{ id: EAppIcon.orange, name: orangeName, color: 'brand' },
	{ id: EAppIcon.black, name: blackName, color: 'black' },
];

const AppIconSettings = ({
	navigation,
}: SettingsScreenProps<'AppIconSettings'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const current = useAppSelector(appIconSelector);

	const onPress = async (icon: AppIcon): Promise<void> => {
		try {
			await changeIcon(icon.name);
			dispatch(updateSettings({ appIcon: icon.id }));
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('app_icon.nav_title')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.container}>
				<View style={styles.sectionHeader}>
					<Caption13Up color="secondary">{t('app_icon.label')}</Caption13Up>
				</View>

				{icons.map((icon) => {
					const isSelected = current === icon.id;
					const isBlack = icon.id === EAppIcon.black;

					return (
						<TouchableOpacity
							key={icon.id}
							activeOpacity={0.6}
							testID={`AppIcon-${icon.id}`}
							onPress={(): Promise<void> => onPress(icon)}>
							<View style={styles.row}>
								<View style={styles.leftColumn}>
									<View style={[styles.icon, isBlack && styles.iconBorder]}>
										<AppIcon height={64} width={64} color={icon.color} />
									</View>

									<View>
										<BodyM color="white">
											{t(`app_icon.${icon.id}.label`)}
										</BodyM>
										<BodyS color="secondary">
											{t(`app_icon.${icon.id}.description`)}
										</BodyS>
									</View>
								</View>
								<View style={styles.rightColumn}>
									{isSelected && (
										<Checkmark color="brand" width={32} height={32} />
									)}
								</View>
							</View>
						</TouchableOpacity>
					);
				})}

				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	sectionHeader: {
		justifyContent: 'center',
		height: 50,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		minHeight: 112,
	},
	leftColumn: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	rightColumn: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	icon: {
		borderRadius: 15,
		marginRight: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconBorder: {
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.32)',
	},
});

export default memo(AppIconSettings);
