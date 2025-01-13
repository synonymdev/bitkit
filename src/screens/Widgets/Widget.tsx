import isEqual from 'lodash/isEqual';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BlocksWidget from '../../components/BlocksWidget';
import FactsWidget from '../../components/FactsWidget';
import FeedWidget from '../../components/FeedWidget';
import HeadlinesWidget from '../../components/HeadlinesWidget';
import HourglassSpinner from '../../components/HourglassSpinner';
import LuganoFeedWidget from '../../components/LuganoFeedWidget';
import NavigationHeader from '../../components/NavigationHeader';
import PriceWidget from '../../components/PriceWidget';
import SafeAreaInset from '../../components/SafeAreaInset';
import SlashtagURL from '../../components/SlashtagURL';
import Spinner from '../../components/Spinner';
import SvgImage from '../../components/SvgImage';
import Button from '../../components/buttons/Button';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useSlashfeed } from '../../hooks/widgets';
import type { RootStackScreenProps } from '../../navigation/types';
import { widgetSelector } from '../../store/reselect/widgets';
import { deleteWidget, setFeedWidget } from '../../store/slices/widgets';
import { TFeedWidget } from '../../store/types/widgets';
import {
	ScrollView,
	View as ThemedView,
	TouchableOpacity,
} from '../../styles/components';
import { ChevronRight, QuestionMarkIcon } from '../../styles/icons';
import { BodyM, Caption13Up, Headline } from '../../styles/text';
import { SUPPORTED_FEED_TYPES } from '../../utils/widgets';
import { getDefaultSettings } from './WidgetEdit';

const Widget = ({
	navigation,
	route,
}: RootStackScreenProps<'Widget'>): ReactElement => {
	const { url, preview } = route.params;
	const { t } = useTranslation('slashtags');
	const { config, icon, loading } = useSlashfeed({ url });
	const dispatch = useAppDispatch();
	const savedWidget = useAppSelector((state) => {
		return widgetSelector(state, url);
	}) as TFeedWidget;

	const defaultSettings = getDefaultSettings(config);
	const savedSelectedFields = savedWidget?.fields.map((f) => f.name);
	const savedExtras = savedWidget?.extras;

	const settings = {
		fields: preview?.fields ?? savedSelectedFields ?? defaultSettings.fields,
		extras: preview?.extras ?? savedExtras ?? defaultSettings.extras,
	};

	const hasEdited = !isEqual(settings, defaultSettings);

	const onEdit = (): void => {
		navigation.navigate('WidgetEdit', {
			url,
			initialFields: settings,
		});
	};

	const onDelete = (): void => {
		dispatch(deleteWidget(url));
		navigation.popToTop();
	};

	const onSave = (): void => {
		if (config) {
			dispatch(
				setFeedWidget({
					url,
					type: config.type,
					extras: settings.extras,
					fields: config.fields.filter((f) => {
						return settings.fields.includes(f.name);
					}),
				}),
			);
		}

		navigation.popToTop();
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('widget_feed')} />

			{!config ? (
				<HourglassSpinner />
			) : (
				<ScrollView contentContainerStyle={styles.content}>
					<View style={styles.header}>
						<View style={styles.headerText}>
							<Headline numberOfLines={2}>{config.name}</Headline>
							<SlashtagURL style={styles.url} url={url} size="large" />
						</View>
						<View style={styles.headerImage}>
							{icon ? (
								<SvgImage image={icon} size={64} />
							) : (
								<QuestionMarkIcon width={64} height={64} />
							)}
						</View>
					</View>

					{config.description && (
						<BodyM style={styles.description} color="secondary">
							{config.description}
						</BodyM>
					)}

					{(config.type === SUPPORTED_FEED_TYPES.PRICE_FEED ||
						config.type === SUPPORTED_FEED_TYPES.BLOCKS_FEED) && (
						<TouchableOpacity
							style={styles.item}
							activeOpacity={0.7}
							testID="WidgetEdit"
							onPress={onEdit}>
							<View style={styles.columnLeft}>
								<BodyM color="white">{t('widget_edit')}</BodyM>
							</View>
							<View style={styles.columnRight}>
								<BodyM style={styles.valueText} testID="Value">
									{hasEdited
										? t('widget_edit_custom')
										: t('widget_edit_default')}
								</BodyM>
								<ChevronRight color="secondary" width={24} height={24} />
							</View>
						</TouchableOpacity>
					)}

					<View style={styles.footer}>
						<Caption13Up style={styles.caption} color="secondary">
							{t('widget_preview')}
						</Caption13Up>

						{((): ReactElement => {
							const previewWidget = {
								type: config.type,
								extras: settings.extras,
								fields: config.fields.filter((f) => {
									return settings.fields.includes(f.name);
								}),
							};

							let testID: string;
							let Component:
								| typeof PriceWidget
								| typeof HeadlinesWidget
								| typeof BlocksWidget
								| typeof FactsWidget
								| typeof FeedWidget;

							switch (config.type) {
								case SUPPORTED_FEED_TYPES.PRICE_FEED:
									Component = PriceWidget;
									testID = 'PriceWidget';
									break;
								case SUPPORTED_FEED_TYPES.HEADLINES_FEED:
									Component = HeadlinesWidget;
									testID = 'HeadlinesWidget';
									break;
								case SUPPORTED_FEED_TYPES.BLOCKS_FEED:
									Component = BlocksWidget;
									testID = 'BlocksWidget';
									break;
								case SUPPORTED_FEED_TYPES.FACTS_FEED:
									Component = FactsWidget;
									testID = 'FactsWidget';
									break;
								case SUPPORTED_FEED_TYPES.LUGANO_FEED:
									Component = LuganoFeedWidget;
									testID = 'LuganoWidget';
									break;
								default:
									Component = FeedWidget;
									testID = 'FeedWidget';
							}

							return !loading ? (
								<Component
									key={url}
									url={url}
									widget={previewWidget}
									testID={testID}
								/>
							) : (
								<ThemedView style={styles.previewLoading} color="white10">
									<Spinner />
								</ThemedView>
							);
						})()}

						<View style={styles.buttonsContainer}>
							{savedWidget && (
								<Button
									style={styles.button}
									text={t('delete')}
									size="large"
									variant="secondary"
									testID="WidgetDelete"
									onPress={onDelete}
								/>
							)}
							<Button
								style={styles.button}
								text={t('save')}
								size="large"
								testID="WidgetSave"
								onPress={onSave}
							/>
						</View>
					</View>
				</ScrollView>
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
		flexGrow: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	headerText: {
		maxWidth: '70%',
	},
	headerImage: {
		borderRadius: 8,
		overflow: 'hidden',
		height: 64,
		width: 64,
	},
	url: {
		marginTop: 4,
	},
	caption: {
		marginBottom: 16,
	},
	footer: {
		paddingTop: 16,
		marginTop: 'auto',
	},
	previewLoading: {
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 180,
	},
	buttonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
	description: {
		fontWeight: 'normal',
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderTopWidth: 1,
		borderBottomWidth: 1,
		marginTop: 16,
		minHeight: 56,
	},
	valueText: {
		marginRight: 15,
	},
	columnLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	columnRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default Widget;
