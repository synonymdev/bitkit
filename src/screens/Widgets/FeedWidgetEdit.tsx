import isEqual from 'lodash/isEqual';
import React, { useState, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import Divider from '../../components/Divider';
import HourglassSpinner from '../../components/HourglassSpinner';
import NavigationHeader from '../../components/NavigationHeader';
import PriceChart from '../../components/PriceChart';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import { useAppDispatch } from '../../hooks/redux';
import { useSlashfeed } from '../../hooks/widgets';
import type { RootStackScreenProps } from '../../navigation/types';
import { deleteWidget } from '../../store/slices/widgets';
import {
	SlashFeedJSON,
	TFeedWidgetOptions,
	TGraphPeriod,
} from '../../store/types/widgets';
import { ScrollView, View as ThemedView } from '../../styles/components';
import { Checkmark } from '../../styles/icons';
import { BodyM, BodySSB, CaptionB } from '../../styles/text';
import { SUPPORTED_FEED_TYPES } from '../../utils/widgets';

export const getDefaultSettings = (
	config?: SlashFeedJSON,
): TFeedWidgetOptions => {
	if (config) {
		if (config.type === SUPPORTED_FEED_TYPES.PRICE_FEED) {
			return {
				fields: ['BTC/USD'],
				extras: { period: '1D', showSource: false },
			};
		}
		if (config.type === SUPPORTED_FEED_TYPES.BLOCKS_FEED) {
			return {
				fields: ['Block', 'Time', 'Date'],
				extras: { showSource: false },
			};
		}
		return { fields: [config.fields[0].name], extras: {} };
	}
	return { fields: [], extras: {} };
};

const FeedWidgetEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'FeedWidgetEdit'>): ReactElement => {
	const { url, initialFields } = route.params;
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();
	const { config, fields, loading } = useSlashfeed({ url });
	const [settings, setSettings] = useState(initialFields);

	const defaultSettings = getDefaultSettings(config);
	const hasEdited = !isEqual(settings, defaultSettings);

	const onSave = (): void => {
		navigation.navigate('FeedWidget', { url, preview: settings });
	};

	const onReset = (): void => {
		dispatch(deleteWidget(url));
		setSettings(defaultSettings);
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('widget_edit')} />

			{!config || loading ? (
				<HourglassSpinner />
			) : (
				<View style={styles.content}>
					{config.name && (
						<BodyM style={styles.description} color="secondary">
							{t('widget_edit_description', { name: config.name })}
						</BodyM>
					)}

					<ScrollView
						showsVerticalScrollIndicator={false}
						testID="WidgetEditScrollView">
						{loading && (
							<BodyM style={styles.loading} color="secondary">
								{t('widget_loading_options')}
							</BodyM>
						)}

						{!loading && (
							<View style={styles.fields}>
								{fields.length > 0 &&
									fields.map((field) => {
										const isSelected = settings.fields.includes(field.name);
										return (
											<Pressable
												key={field.name}
												testID={`WidgetEditField-${field.name}`}
												onPress={(): void => {
													if (isSelected) {
														setSettings((prevState) => ({
															...prevState,
															fields: prevState.fields.filter(
																(f) => f !== field.name,
															),
														}));
													} else {
														setSettings((prevState) => ({
															...prevState,
															fields: [...prevState.fields, field.name],
														}));
													}
												}}>
												<View style={styles.fieldContainer}>
													<View style={styles.fieldLeftContainer}>
														<BodySSB color="secondary">{field.name}</BodySSB>
													</View>
													<View style={styles.fieldRightContainer}>
														<BodySSB numberOfLines={1} ellipsizeMode="middle">
															{field.value}
														</BodySSB>
													</View>
													<Checkmark
														style={styles.checkmark}
														color={isSelected ? 'brand' : 'gray3'}
														height={30}
														width={30}
													/>
												</View>
												<Divider />
											</Pressable>
										);
									})}

								{config.type === SUPPORTED_FEED_TYPES.PRICE_FEED &&
									config.fields &&
									Object.keys(config.fields[0].files).map((period) => {
										const allowedPeriods = ['1D', '1W', '1M'];
										const isSelected = settings.extras?.period === period;

										if (!allowedPeriods.includes(period)) {
											return;
										}

										return (
											<Pressable
												key={period}
												testID={`PriceWidgetSetting-${period}`}
												onPress={(): void => {
													setSettings((prevState) => ({
														...prevState,
														extras: {
															...prevState.extras,
															period: period as TGraphPeriod,
														},
													}));
												}}>
												<View style={styles.fieldContainer}>
													<PriceChart
														url={url}
														field={config.fields[0]}
														period={period as TGraphPeriod}
													/>
													<Checkmark
														style={styles.checkmark}
														color={isSelected ? 'brand' : 'gray3'}
														height={30}
														width={30}
													/>
												</View>
												<Divider />
											</Pressable>
										);
									})}

								{config.source && (
									<Pressable
										testID="WidgetEditSource"
										onPress={(): void => {
											setSettings((prevState) => ({
												...prevState,
												extras: {
													...prevState.extras,
													showSource: !prevState.extras?.showSource,
												},
											}));
										}}>
										<View style={styles.fieldContainer}>
											<CaptionB color="secondary">Source</CaptionB>
											<View style={styles.fieldRightContainer}>
												<CaptionB color="secondary">
													{config.source.name}
												</CaptionB>
											</View>
											<Checkmark
												style={styles.checkmark}
												color={settings.extras?.showSource ? 'brand' : 'gray3'}
												height={30}
												width={30}
											/>
										</View>
										<Divider />
									</Pressable>
								)}
							</View>
						)}
					</ScrollView>

					<View style={styles.buttonsContainer}>
						<Button
							style={styles.button}
							text={t('widget_reset')}
							variant="secondary"
							size="large"
							disabled={!hasEdited}
							testID="WidgetEditReset"
							onPress={onReset}
						/>
						<Button
							style={styles.button}
							text={t('widget_preview')}
							size="large"
							testID="WidgetEditPreview"
							onPress={onSave}
						/>
					</View>
				</View>
			)}
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	description: {
		marginBottom: 32,
	},
	loading: {
		marginTop: 16,
	},
	fields: {
		paddingBottom: 16,
	},
	fieldContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	fieldLeftContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	fieldRightContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	checkmark: {
		marginLeft: 16,
	},
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
		paddingTop: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default FeedWidgetEdit;
