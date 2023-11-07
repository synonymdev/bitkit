import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { __DISABLE_SLASHTAGS__ } from '../constants/env';
import { rootNavigation } from '../navigation/root/RootNavigator';
import { TouchableOpacity, View } from '../styles/components';
import { Caption13Up, Text, Text01M } from '../styles/text';
import { PlusIcon, SortAscendingIcon, Checkmark } from '../styles/icons';
import { SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { setWidgetsSortOrder } from '../store/actions/widgets';
import PriceWidget from './PriceWidget';
import AuthWidget from './AuthWidget';
import FeedWidget from './FeedWidget';
import HeadlinesWidget from './HeadlinesWidget';
import BlocksWidget from './BlocksWidget';
import FactsWidget from './FactsWidget';
import LuganoFeedWidget from './LuganoFeedWidget';
import { IWidget } from '../store/types/widgets';
import {
	onboardedWidgetsSelector,
	widgetsOrderSelector,
	widgetsSelector,
} from '../store/reselect/widgets';

const Widgets = (): ReactElement => {
	const { t } = useTranslation('slashtags');
	const widgets = useSelector(widgetsSelector);
	const sortOrder = useSelector(widgetsOrderSelector);
	const onboardedWidgets = useSelector(onboardedWidgetsSelector);
	const [editing, setEditing] = useState(false);

	useFocusEffect(useCallback(() => setEditing(false), []));

	const sortedWidgets = useMemo(() => {
		const savedWidgets = Object.entries(widgets) as [string, IWidget][];
		return savedWidgets.sort(
			([a], [b]) => sortOrder.indexOf(a) - sortOrder.indexOf(b),
		);
	}, [widgets, sortOrder]);

	const onDragEnd = useCallback(({ data }) => {
		const order = data.map((i): string => i[0]);
		setWidgetsSortOrder(order);
	}, []);

	const onAdd = (): void => {
		const screen = onboardedWidgets ? 'WidgetsSuggestions' : 'GoodbyePasswords';
		rootNavigation.navigate(screen);
	};

	const renderItem = useCallback(
		({ item, drag }: RenderItemParams<[string, IWidget]>): ReactElement => {
			let [url, widget] = item;

			const _drag = (): void => {
				// only allow dragging if there are more than 1 widget
				if (sortedWidgets.length > 1 && editing) {
					drag();
				}
			};

			if (!widget.fields) {
				return (
					<ScaleDecorator>
						<AuthWidget
							style={styles.widget}
							url={url}
							widget={widget}
							isEditing={editing}
							onLongPress={_drag}
							onPressIn={_drag}
						/>
					</ScaleDecorator>
				);
			}

			let testID: string;
			let Component:
				| typeof PriceWidget
				| typeof HeadlinesWidget
				| typeof BlocksWidget
				| typeof FactsWidget
				| typeof FeedWidget;

			switch (widget.type) {
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
						widget={widget}
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

	if (__DISABLE_SLASHTAGS__) {
		return (
			<>
				<View style={styles.title}>
					<Caption13Up color="gray1">{t('widgets')}</Caption13Up>
				</View>
				<Text color="gray">{t('disabled')}</Text>
			</>
		);
	}

	return (
		<>
			<View style={styles.title} testID="WidgetsTitle">
				<Caption13Up color="gray1">{t('widgets')}</Caption13Up>
				{sortedWidgets.length > 0 && (
					<TouchableOpacity
						style={styles.edit}
						testID="WidgetsEdit"
						onPress={(): void => setEditing(!editing)}>
						{editing ? (
							<Checkmark width={24} height={24} color="gray1" />
						) : (
							<SortAscendingIcon color="gray1" />
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

			<TouchableOpacity
				style={styles.add}
				color="white08"
				onPress={onAdd}
				testID="WidgetsAdd">
				<View color="green16" style={styles.iconCircle}>
					<PlusIcon height={16} color="green" />
				</View>
				<Text01M>{t('widget_add')}</Text01M>
			</TouchableOpacity>
		</>
	);
};

const styles = StyleSheet.create({
	title: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 30,
	},
	edit: {
		// increase hitbox
		paddingTop: 10,
		marginTop: -10,
		paddingBottom: 10,
		marginBottom: -10,
		paddingRight: 16,
		marginRight: -16,
		paddingLeft: 16,
		marginLeft: -16,
	},
	widget: {
		marginTop: 16,
	},
	add: {
		marginTop: 16,
		borderRadius: 16,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconCircle: {
		borderRadius: 20,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
});

export default memo(Widgets);
