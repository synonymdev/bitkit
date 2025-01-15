import { useFocusEffect } from '@react-navigation/native';
import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { rootNavigation } from '../navigation/root/RootNavigator';
import {
	onboardedWidgetsSelector,
	widgetsOrderSelector,
	widgetsSelector,
} from '../store/reselect/widgets';
import { setWidgetsSortOrder } from '../store/slices/widgets';
import { TFeedWidget } from '../store/types/widgets';
import { TouchableOpacity, View } from '../styles/components';
import { Checkmark, PlusIcon, SortAscendingIcon } from '../styles/icons';
import { Caption13Up } from '../styles/text';
import { SUPPORTED_FEED_TYPES } from '../utils/widgets';
import BlocksWidget from './BlocksWidget';
import FactsWidget from './FactsWidget';
import FeedWidget from './FeedWidget';
import HeadlinesWidget from './HeadlinesWidget';
import LuganoFeedWidget from './LuganoFeedWidget';
import PriceWidget from './PriceWidget';
import Button from './buttons/Button';
import CalculatorWidget from './widgets/CalculatorWidget';

const Widgets = (): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();

	const widgets = useAppSelector(widgetsSelector);
	const sortOrder = useAppSelector(widgetsOrderSelector);
	const onboardedWidgets = useAppSelector(onboardedWidgetsSelector);
	const [editing, setEditing] = useState(false);

	useFocusEffect(useCallback(() => setEditing(false), []));

	const sortedWidgets = useMemo(() => {
		const savedWidgets = Object.keys(widgets);

		const sorted = savedWidgets.sort((a, b) => {
			const indexA = sortOrder.indexOf(a);
			const indexB = sortOrder.indexOf(b);
			return indexA - indexB;
		});

		return sorted;
	}, [widgets, sortOrder]);

	const onDragEnd = useCallback(
		({ data }) => {
			const order = data.map((id): string => id);
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
		({ item: id, drag }: RenderItemParams<string>): ReactElement => {
			const initiateDrag = (): void => {
				// only allow dragging if there are more than 1 widget
				if (sortedWidgets.length > 1 && editing) {
					drag();
				}
			};

			let testID: string;
			let Component:
				| typeof PriceWidget
				| typeof HeadlinesWidget
				| typeof BlocksWidget
				| typeof FactsWidget
				| typeof FeedWidget
				| typeof CalculatorWidget;

			if (id === 'calculator') {
				Component = CalculatorWidget;
				testID = 'CalculatorWidget';

				return (
					<ScaleDecorator>
						<Component
							style={styles.widget}
							isEditing={editing}
							testID={testID}
							onLongPress={initiateDrag}
							onPressIn={initiateDrag}
						/>
					</ScaleDecorator>
				);
			}

			const feedWidget = widgets[id] as TFeedWidget;

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
						url={id}
						widget={feedWidget}
						isEditing={editing}
						testID={testID}
						onLongPress={initiateDrag}
						onPressIn={initiateDrag}
					/>
				</ScaleDecorator>
			);
		},
		[editing, widgets, sortedWidgets.length],
	);

	return (
		<View style={styles.root}>
			<View style={styles.title} testID="WidgetsTitle">
				<Caption13Up color="secondary">{t('widgets')}</Caption13Up>
				{sortedWidgets.length > 0 && (
					<TouchableOpacity
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
				keyExtractor={(id): string => id}
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
