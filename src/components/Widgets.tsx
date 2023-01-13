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
import { View, TouchableOpacity } from '../styles/components';
import { Subtitle, Text, Text01M } from '../styles/text';
import { PlusIcon, ListIcon, XIcon } from '../styles/icons';
import { SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { setWidgetsSortOrder } from '../store/actions/widgets';

import PriceWidget from './PriceWidget';
import AuthWidget from './AuthWidget';
import FeedWidget from './FeedWidget';
import HeadlinesWidget from './HeadlinesWidget';
import BlocksWidget from './BlocksWidget';
import FactsWidget from './FactsWidget';
import { DISABLE_SLASHTAGS } from '@env';

export const Widgets = ({
	onEditStart,
	onEditEnd,
}: {
	onEditStart: () => void;
	onEditEnd: () => void;
}): ReactElement => {
	const widgets = useSelector((state: Store) => state.widgets.widgets);
	const sortOrder = useSelector((state: Store) => state.widgets.sortOrder);
	const [editing, setEditing] = useState(false);

	const widgetsArray = useMemo(() => {
		return Object.entries(widgets).sort(
			([a], [b]) => sortOrder.indexOf(a) - sortOrder.indexOf(b),
		);
	}, [widgets, sortOrder]);

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

	const renderEditing = useCallback(
		({ item, drag }: RenderItemParams<Array<any>>): ReactElement => {
			const [url, widget] = item;

			if (!widget.feed) {
				return (
					<ScaleDecorator>
						<AuthWidget
							url={url}
							widget={widget}
							isEditing={true}
							onLongPress={drag}
							onPressIn={drag}
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
						isEditing={true}
						onLongPress={drag}
						onPressIn={drag}
					/>
				</ScaleDecorator>
			);
		},
		[],
	);

	const renderFlat = useCallback(
		(item): ReactElement => {
			const [url, widget] = item;

			if (!widget.feed) {
				return (
					<AuthWidget
						key={url}
						url={url}
						widget={widget}
						isEditing={false}
						onLongPress={handleEditStart}
					/>
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
				<Component
					key={url}
					url={url}
					widget={widget}
					isEditing={false}
					onLongPress={handleEditStart}
				/>
			);
		},
		[handleEditStart],
	);

	const onAdd = useCallback((): void => {
		navigate('WidgetsRoot');
	}, []);

	return DISABLE_SLASHTAGS ? (
		<>
			<View style={styles.titleRow}>
				<Subtitle style={styles.title}>Widgets</Subtitle>
			</View>
			<Text color="gray">SLASHTAGS DISABLED</Text>
		</>
	) : (
		<>
			<View style={styles.titleRow}>
				<Subtitle style={styles.title}>Widgets</Subtitle>
				{widgetsArray.length > 0 && (
					<TouchableOpacity
						style={styles.edit}
						onPress={editing ? handleEditEnd : handleEditStart}>
						{editing ? (
							<XIcon width={24} height={24} color="gray1" />
						) : (
							<ListIcon color="gray1" />
						)}
					</TouchableOpacity>
				)}
			</View>
			{editing ? (
				<NestableScrollContainer>
					<NestableDraggableFlatList
						data={widgetsArray}
						keyExtractor={(item): string => item[0]}
						renderItem={renderEditing}
						onDragEnd={handleDragEnd}
						activationDistance={1}
					/>
				</NestableScrollContainer>
			) : (
				widgetsArray.map(renderFlat)
			)}
			<TouchableOpacity style={styles.add} onPress={onAdd}>
				<View color="green16" style={styles.iconCircle}>
					<PlusIcon height={16} color="green" />
				</View>
				<Text01M>Add Widget</Text01M>
			</TouchableOpacity>
		</>
	);
};

const styles = StyleSheet.create({
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	title: {
		paddingTop: 32,
		paddingBottom: 8,
	},
	edit: {
		paddingTop: 32,
		paddingBottom: 8,
		paddingLeft: 16,
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
