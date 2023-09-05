import React, { useState, ReactElement } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash.isequal';

import { ScrollView, View as ThemedView } from '../../styles/components';
import { Caption13M, Text01S, Text02M } from '../../styles/text';
import { Checkmark } from '../../styles/icons';
import { SUPPORTED_FEED_TYPES } from '../../utils/widgets';
import { useSlashfeed } from '../../hooks/widgets';
import { deleteWidget } from '../../store/actions/widgets';
import {
	SlashFeedJSON,
	TGraphPeriod,
	TWidgetSettings,
} from '../../store/types/widgets';
import NavigationHeader from '../../components/NavigationHeader';
import HourglassSpinner from '../../components/HourglassSpinner';
import SafeAreaInset from '../../components/SafeAreaInset';
import Divider from '../../components/Divider';
import Button from '../../components/Button';
import PriceChart from '../../components/PriceChart';
import type { RootStackScreenProps } from '../../navigation/types';

export const getDefaultSettings = (config?: SlashFeedJSON): TWidgetSettings => {
	if (config) {
		if (config.type === SUPPORTED_FEED_TYPES.PRICE_FEED) {
			return {
				fields: ['BTC/USD'],
				extras: { period: '1D', showSource: false },
			};
		}
		if (config.type === SUPPORTED_FEED_TYPES.BLOCKS_FEED) {
			return {
				fields: ['Block', 'Date', 'Time'],
				extras: { showSource: false },
			};
		}
		return { fields: [config.fields[0].name] };
	}
	return { fields: [] };
};

const WidgetEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'WidgetEdit'>): ReactElement => {
	const { url, initialFields } = route.params;
	const { t } = useTranslation('slashtags');
	const { config, fields, loading } = useSlashfeed({ url });
	const [settings, setSettings] = useState(initialFields);

	const defaultSettings = getDefaultSettings(config);
	const hasEdited = !isEqual(settings, defaultSettings);

	const onSave = (): void => {
		navigation.navigate('Widget', { url, preview: settings });
	};

	const onReset = (): void => {
		deleteWidget(url);
		setSettings(defaultSettings);
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('widget_edit')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>

			{!config || loading ? (
				<HourglassSpinner />
			) : (
				<View style={styles.content}>
					{config.name && (
						<Text01S style={styles.description} color="gray1">
							{t('widget_edit_description', { name: config.name })}
						</Text01S>
					)}

					{fields.length > 0 && (
						<ScrollView
							showsVerticalScrollIndicator={false}
							testID="WidgetEditScrollView">
							{loading && (
								<Text01S style={styles.loading} color="gray1">
									{t('widget_loading_options')}
								</Text01S>
							)}

							{!loading && (
								<View style={styles.fields}>
									{fields.map((field) => {
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
														<Text02M color="gray1">{field.name}</Text02M>
													</View>
													<View style={styles.fieldRightContainer}>
														<Text02M numberOfLines={1} ellipsizeMode="middle">
															{field.value}
														</Text02M>
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

									{config.type === SUPPORTED_FEED_TYPES.PRICE_FEED && (
										<>
											{config.fields &&
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
										</>
									)}

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
												<Caption13M color="gray1">Source</Caption13M>
												<View style={styles.fieldRightContainer}>
													<Caption13M color="gray1">
														{config.source.name}
													</Caption13M>
												</View>
												<Checkmark
													style={styles.checkmark}
													color={
														settings.extras?.showSource ? 'brand' : 'gray3'
													}
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
					)}

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
						<View style={styles.divider} />
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
		marginTop: 'auto',
		paddingTop: 16,
		flexDirection: 'row',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default WidgetEdit;
