import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { rootNavigation } from '../navigation/root/RootNavigator';
import { Caption13Up } from '../styles/text';
import { TouchableOpacity, View } from '../styles/components';
import { PlusIcon, SortAscendingIcon, Checkmark } from '../styles/icons';
import Button from './buttons/Button';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { setWidgetsSortOrder } from '../store/slices/widgets';
import PriceWidget from './PriceWidget';
import FeedWidget from './FeedWidget';
import HeadlinesWidget from './HeadlinesWidget';
import BlocksWidget from './BlocksWidget';
import FactsWidget from './FactsWidget';
import LuganoFeedWidget from './LuganoFeedWidget';
import { TFeedWidget, TWidget } from '../store/types/widgets';
import {
	onboardedWidgetsSelector,
	widgetsOrderSelector,
	widgetsSelector,
} from '../store/reselect/widgets';

const Widgets = (): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();
	const widgets = useAppSelector(widgetsSelector);
	const sortOrder = useAppSelector(widgetsOrderSelector);
	const onboardedWidgets = useAppSelector(onboardedWidgetsSelector);
	const [editing, setEditing] = useState(false);

	useFocusEffect(useCallback(() => setEditing(false), []));

	const sortedWidgets = useMemo(() => {
		const savedWidgets = Object.entries(widgets) as [string, TWidget][];
		return savedWidgets.sort(
			([a], [b]) => sortOrder.indexOf(a) - sortOrder.indexOf(b),
		);
	}, [widgets, sortOrder]);

	const onDragEnd = useCallback(
		({ data }) => {
			const order = data.map((i): string => i[0]);
			dispatch(setWidgetsSortOrder(order));
		},
		[dispatch],
	);

	const onAdd = (): void => {
		const screen = onboardedWidgets
			? 'WidgetsSuggestions'
			: 'WidgetsOnboarding';
		rootNavigation.navigate(screen);
	};

	const renderItem = useCallback(
		({ item, drag }: RenderItemParams<[string, TWidget]>): ReactElement => {
			const [url, widget] = item;

			const _drag = (): void => {
				// only allow dragging if there are more than 1 widget
				if (sortedWidgets.length > 1 && editing) {
					drag();
				}
			};

			const feedWidget = widget as TFeedWidget;

			let testID: string;
			let Component:
				| typeof PriceWidget
				| typeof HeadlinesWidget
				| typeof BlocksWidget
				| typeof FactsWidget
				| typeof FeedWidget;

			switch (feedWidget.type) {
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

			return (
				<ScaleDecorator>
					<Component
						style={styles.widget}
						url={url}
						widget={feedWidget}
						isEditing={editing}
						onLongPress={_drag}
						onPressIn={_drag}
						testID={testID}
					/>
				</ScaleDecorator>
			);
		},
		[editing, sortedWidgets.length],
	);

	return (
		<View style={styles.root}>
			<View style={styles.title} testID="WidgetsTitle">
				<Caption13Up color="secondary">{t('widgets')}</Caption13Up>
				{sortedWidgets.length > 0 && (
					<TouchableOpacity
						activeOpacity={0.7}
						hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
						testID="WidgetsEdit"
						onPress={(): void => setEditing(!editing)}>
						{editing ? (
							<Checkmark width={24} height={24} color="secondary" />
						) : (
							<SortAscendingIcon color="secondary" />
						)}
					</TouchableOpacity>
				)}
			</View>

			<DraggableFlatList
				data={sortedWidgets}
				keyExtractor={(item): string => item[0]}
				renderItem={renderItem}
				scrollEnabled={false}
				activationDistance={editing ? 0 : 100}
				onDragEnd={onDragEnd}
			/>

			<Button
				style={styles.button}
				text={t('widget_add')}
				size="large"
				variant="tertiary"
				icon={<PlusIcon height={16} width={16} />}
				testID="WidgetsAdd"
				onPress={onAdd}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		marginTop: 32,
	},
	title: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	widget: {
		marginTop: 16,
	},
	button: {
		marginTop: 16,
	},
});

export default memo(Widgets);
