import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash/isEqual';

import {
	ScrollView,
	View as ThemedView,
	TouchableOpacity,
} from '../../styles/components';
import { Caption13Up, Headline, Text01S } from '../../styles/text';
import { ChevronRight, QuestionMarkIcon } from '../../styles/icons';
import Store from '../../store/types';
import { widgetSelector } from '../../store/reselect/widgets';
import { deleteWidget, setFeedWidget } from '../../store/actions/widgets';
import { SUPPORTED_FEED_TYPES } from '../../utils/widgets';
import { useSlashfeed } from '../../hooks/widgets';
import { getDefaultSettings } from './WidgetEdit';
import Button from '../../components/Button';
import SvgImage from '../../components/SvgImage';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import HourglassSpinner from '../../components/HourglassSpinner';
import SlashtagURL from '../../components/SlashtagURL';
import PriceWidget from '../../components/PriceWidget';
import HeadlinesWidget from '../../components/HeadlinesWidget';
import BlocksWidget from '../../components/BlocksWidget';
import FeedWidget from '../../components/FeedWidget';
import FactsWidget from '../../components/FactsWidget';
import LuganoFeedWidget from '../../components/LuganoFeedWidget';
import Spinner from '../../components/Spinner';
import type { RootStackScreenProps } from '../../navigation/types';

const Widget = ({
	navigation,
	route,
}: RootStackScreenProps<'Widget'>): ReactElement => {
	const { url, preview } = route.params;
	const { t } = useTranslation('slashtags');
	const { config, icon, loading } = useSlashfeed({ url });
	const savedWidget = useSelector((state: Store) => widgetSelector(state, url));

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
		deleteWidget(url);
		navigation.navigate('Wallet');
	};

	const onSave = (): void => {
		if (config) {
			setFeedWidget({
				url,
				type: config.type,
				extras: settings.extras,
				fields: config.fields.filter((f) => {
					return settings.fields.includes(f.name);
				}),
			});
		}

		navigation.navigate('Wallet');
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('widget_feed')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>

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
						<Text01S style={styles.description} color="gray1">
							{config.description}
						</Text01S>
					)}

					{(config.type === SUPPORTED_FEED_TYPES.PRICE_FEED ||
						config.type === SUPPORTED_FEED_TYPES.BLOCKS_FEED) && (
						<TouchableOpacity
							style={styles.item}
							activeOpacity={0.6}
							testID="WidgetEdit"
							onPress={onEdit}>
							<View style={styles.columnLeft}>
								<Text01S color="white">{t('widget_edit')}</Text01S>
							</View>
							<View style={styles.columnRight}>
								<Text01S style={styles.valueText} testID="Value">
									{hasEdited
										? t('widget_edit_custom')
										: t('widget_edit_default')}
								</Text01S>
								<ChevronRight color="gray1" width={24} height={24} />
							</View>
						</TouchableOpacity>
					)}

					<View style={styles.footer}>
						<Caption13Up style={styles.caption} color="gray1">
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

							switch (config.type) {
								case SUPPORTED_FEED_TYPES.PRICE_FEED:
									return (
										<PriceWidget key={url} url={url} widget={previewWidget} />
									);
								case SUPPORTED_FEED_TYPES.HEADLINES_FEED:
									return <HeadlinesWidget key={url} url={url} />;
								case SUPPORTED_FEED_TYPES.BLOCKS_FEED:
									return (
										<BlocksWidget key={url} url={url} widget={previewWidget} />
									);
								case SUPPORTED_FEED_TYPES.FACTS_FEED:
									return <FactsWidget key={url} url={url} />;
								case SUPPORTED_FEED_TYPES.LUGANO_FEED:
									return <LuganoFeedWidget key={url} url={url} />;
								default:
									return !loading ? (
										<FeedWidget key={url} url={url} widget={previewWidget} />
									) : (
										<ThemedView style={styles.previewLoading} color="white08">
											<Spinner />
										</ThemedView>
									);
							}
						})()}

						<View style={styles.buttonsContainer}>
							{savedWidget && (
								<>
									<Button
										style={styles.button}
										text={t('delete')}
										size="large"
										variant="secondary"
										testID="WidgetDelete"
										onPress={onDelete}
									/>
									<View style={styles.divider} />
								</>
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
		paddingTop: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
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
