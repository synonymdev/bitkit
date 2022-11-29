import React, {
	ReactElement,
	useState,
	useCallback,
	useMemo,
	memo,
} from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import {
	NestableDraggableFlatList,
	NestableScrollContainer,
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useFocusEffect } from '@react-navigation/native';

import { navigate } from '../navigation/root/RootNavigator';
import Store from '../store/types';
import {
	PlusIcon,
	Subtitle,
	Text01M,
	TouchableOpacity,
	View,
	ListIcon,
	XIcon,
} from '../styles/components';
import { SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { setWidgetsSortOrder } from '../store/actions/widgets';

import PriceWidget from './PriceWidget';
import AuthWidget from './AuthWidget';
import FeedWidget from './FeedWidget';
import HeadlinesWidget from './HeadlinesWidget';
import BlocksWidget from './BlocksWidget';
import FactsWidget from './FactsWidget';

export const Widgets = ({ onEditStart, onEditEnd }): ReactElement => {
	const widgets = useSelector((state: Store) => state.widgets.widgets);
	const sortOrder = useSelector(
		(state: Store) => state.widgets.sortOrder ?? [],
	);
	const widgetsArray = useMemo(
		() =>
			Object.entries(widgets).sort(
				([a], [b]) => sortOrder.indexOf(a) - sortOrder.indexOf(b),
			),
		[widgets, sortOrder],
	);
	const [editing, setEditing] = useState<boolean>(false);

	const handleEditStart = useCallback((): void => {
		setEditing(true);
		onEditStart();
	}, [onEditStart]);
	const handleEditEnd = useCallback((): void => {
		setEditing(false);
		onEditEnd();
	}, [onEditEnd]);

	useFocusEffect(useCallback(handleEditEnd, [handleEditEnd]));

	const handleDragEnd = useCallback(({ data }) => {
		const order = data.map((i): string => i[0]);
		setWidgetsSortOrder(order);
	}, []);

	const renderItem = useCallback(
		({
			// isActive,
			item,
			drag,
		}: RenderItemParams<Array<any>>): ReactElement => {
			const [url, widget] = item;

			if (!widget.feed) {
				return (
					<ScaleDecorator>
						<AuthWidget
							url={url}
							widget={widget}
							isEditing={editing}
							onLongPress={editing ? drag : handleEditStart}
							onPressIn={editing ? drag : undefined}
						/>
					</ScaleDecorator>
				);
			}

			let Component;
			switch (widget.feed.type) {
				case SUPPORTED_FEED_TYPES.PRICE_FEED:
					Component = PriceWidget;
					break;
				case SUPPORTED_FEED_TYPES.HEADLINES_FEED:
					Component = HeadlinesWidget;
					break;
				case SUPPORTED_FEED_TYPES.BLOCKS_FEED:
					Component = BlocksWidget;
					break;
				case SUPPORTED_FEED_TYPES.FACTS_FEED:
					Component = FactsWidget;
					break;
				default:
					Component = FeedWidget;
			}

			return (
				<ScaleDecorator>
					<Component
						url={url}
						widget={widget}
						isEditing={editing}
						onLongPress={editing ? drag : handleEditStart}
						onPressIn={editing ? drag : undefined}
					/>
				</ScaleDecorator>
			);
		},
		[editing, handleEditStart],
	);

	const onAdd = useCallback((): void => {
		navigate('WidgetsRoot');
	}, []);

	return (
		<NestableScrollContainer>
			<View style={styles.title}>
				<Subtitle>Widgets</Subtitle>
				<TouchableOpacity onPress={editing ? handleEditEnd : handleEditStart}>
					{editing ? (
						<XIcon width={24} height={24} color="gray1" />
					) : (
						<ListIcon color="gray1" />
					)}
				</TouchableOpacity>
			</View>
			<NestableDraggableFlatList
				data={widgetsArray}
				keyExtractor={(item): string => item[0]}
				renderItem={renderItem}
				onDragEnd={handleDragEnd}
				{...(editing ? { activationDistance: 1 } : {})}
			/>
			<TouchableOpacity style={styles.add} onPress={onAdd}>
				<View color="green16" style={styles.iconCircle}>
					<PlusIcon height={16} color="green" />
				</View>
				<Text01M>Add Widget</Text01M>
			</TouchableOpacity>
		</NestableScrollContainer>
	);
};

const styles = StyleSheet.create({
	title: {
		marginTop: 32,
		marginBottom: 8,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	add: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
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
