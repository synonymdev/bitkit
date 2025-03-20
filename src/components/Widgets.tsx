import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import React, { ReactElement, memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { RootNavigationProp } from '../navigation/types';
import {
	onboardedWidgetsSelector,
	widgetsOrderSelector,
	widgetsSelector,
} from '../store/reselect/widgets';
import { setWidgetsSortOrder } from '../store/slices/widgets';
import {
	TBlocksWidgetOptions,
	TFactsWidgetOptions,
	TNewsWidgetOptions,
	TPriceWidgetOptions,
	TWeatherWidgetOptions,
} from '../store/types/widgets';
import { TouchableOpacity, View } from '../styles/components';
import { Checkmark, PlusIcon, SortAscendingIcon } from '../styles/icons';
import { Caption13Up } from '../styles/text';
import Button from './buttons/Button';
import BlocksWidget from './widgets/BlocksWidget';
import CalculatorWidget from './widgets/CalculatorWidget';
import FactsWidget from './widgets/FactsWidget';
import NewsWidget from './widgets/NewsWidget';
import PriceWidget from './widgets/PriceWidget';
import WeatherWidget from './widgets/WeatherWidget';

const Widgets = (): ReactElement => {
	const { t } = useTranslation('widgets');
	const dispatch = useAppDispatch();
	const navigation = useNavigation<RootNavigationProp>();

	const widgets = useAppSelector(widgetsSelector);
	const sortOrder = useAppSelector(widgetsOrderSelector);
	const onboardedWidgets = useAppSelector(onboardedWidgetsSelector);
	const [editing, setEditing] = useState(false);

	useFocusEffect(useCallback(() => setEditing(false), []));

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
		navigation.navigate(screen);
	};

	const renderItem = useCallback(
		({ item: id, drag }: RenderItemParams<string>): ReactElement => {
			const initiateDrag = (): void => {
				// only allow dragging if there are more than 1 widget
				if (sortOrder.length > 1 && editing) {
					drag();
				}
			};

			if (id === 'blocks') {
				const options = widgets[id] as TBlocksWidgetOptions;
				return (
					<BlocksWidget
						style={styles.widget}
						options={options}
						isEditing={editing}
						testID="BlocksWidget"
						onLongPress={initiateDrag}
						onPressIn={initiateDrag}
					/>
				);
			}

			if (id === 'calculator') {
				return (
					<CalculatorWidget
						style={styles.widget}
						isEditing={editing}
						testID="CalculatorWidget"
						onLongPress={initiateDrag}
						onPressIn={initiateDrag}
					/>
				);
			}

			if (id === 'facts') {
				const options = widgets[id] as TFactsWidgetOptions;
				return (
					<FactsWidget
						style={styles.widget}
						options={options}
						isEditing={editing}
						testID="FactsWidget"
						onLongPress={initiateDrag}
						onPressIn={initiateDrag}
					/>
				);
			}

			if (id === 'news') {
				const options = widgets[id] as TNewsWidgetOptions;
				return (
					<NewsWidget
						style={styles.widget}
						options={options}
						isEditing={editing}
						testID="NewsWidget"
						onLongPress={initiateDrag}
						onPressIn={initiateDrag}
					/>
				);
			}

			if (id === 'weather') {
				const options = widgets[id] as TWeatherWidgetOptions;
				return (
					<WeatherWidget
						style={styles.widget}
						options={options}
						isEditing={editing}
						testID="WeatherWidget"
						onLongPress={initiateDrag}
						onPressIn={initiateDrag}
					/>
				);
			}

			const options = widgets[id] as TPriceWidgetOptions;
			return (
				<PriceWidget
					style={styles.widget}
					options={options}
					isEditing={editing}
					testID="PriceWidget"
					onLongPress={initiateDrag}
					onPressIn={initiateDrag}
				/>
			);
		},
		[editing, widgets, sortOrder.length],
	);

	return (
		<View style={styles.root}>
			<View style={styles.title} testID="WidgetsTitle">
				<Caption13Up color="secondary">{t('widgets')}</Caption13Up>
				{sortOrder.length > 0 && (
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
				data={sortOrder}
				keyExtractor={(id): string => id}
				renderItem={(params): ReactElement => (
					<ScaleDecorator>{renderItem(params)}</ScaleDecorator>
				)}
				scrollEnabled={false}
				activationDistance={editing ? 0 : 100}
				onDragEnd={onDragEnd}
			/>

			<Button
				style={styles.button}
				text={t('add')}
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
