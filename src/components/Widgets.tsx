import React, {
	ReactElement,
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	useEffect,
} from 'react';
import { StyleSheet, Modal } from 'react-native';
import { useSelector } from 'react-redux';
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { useIsFocused } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { rootNavigation } from '../navigation/root/RootNavigator';
import Store from '../store/types';
import { AnimatedView, TouchableOpacity, View } from '../styles/components';
import { Subtitle, Text, Text01M } from '../styles/text';
import { PlusIcon, SortAscendingIcon, Checkmark } from '../styles/icons';
import { SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { setWidgetsSortOrder } from '../store/actions/widgets';

import PriceWidget from './PriceWidget';
import AuthWidget from './AuthWidget';
import FeedWidget from './FeedWidget';
import HeadlinesWidget from './HeadlinesWidget';
import BlocksWidget from './BlocksWidget';
import FactsWidget from './FactsWidget';
import { isSlashtagsDisabled } from '../utils/slashtags';

type WCM = {
	x: number;
	y: number;
	width: number;
	height: number;
	pageX: number;
	pageY: number;
};

export const Widgets = (): ReactElement => {
	const widgets = useSelector((state: Store) => state.widgets.widgets);
	const sortOrder = useSelector((state: Store) => state.widgets.sortOrder);
	const [editing, setEditing] = useState(false);
	const widgetsContainer = useRef<any>(null);
	const [wcm, setwcm] = useState<undefined | WCM>();
	const isFocused = useIsFocused();

	const widgetsArray = useMemo(() => {
		return Object.entries(widgets).sort(
			([a], [b]) => sortOrder.indexOf(a) - sortOrder.indexOf(b),
		);
	}, [widgets, sortOrder]);

	const handleEditStart = useCallback(async (): Promise<void> => {
		const res: WCM = await new Promise((resolve) => {
			widgetsContainer.current?.measure((x, y, width, height, pageX, pageY) => {
				resolve({ x, y, width, height, pageX, pageY });
			});
		});
		setwcm(res);
		setEditing(true);
	}, []);
	const handleEditEnd = useCallback((): void => {
		setEditing(false);
	}, []);

	useEffect(() => {
		if (isFocused) {
			return;
		}
		handleEditEnd();
	}, [isFocused, handleEditEnd]);

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
		rootNavigation.navigate('WidgetsRoot');
	}, []);

	if (isSlashtagsDisabled) {
		return (
			<>
				<View style={styles.titleRow}>
					<Subtitle style={styles.title}>Widgets</Subtitle>
				</View>
				<Text color="gray">SLASHTAGS DISABLED</Text>
			</>
		);
	}

	return (
		<>
			<View style={styles.titleRow}>
				<Subtitle style={styles.title}>Widgets</Subtitle>
				{widgetsArray.length > 0 && (
					<TouchableOpacity
						style={styles.edit}
						onPress={editing ? handleEditEnd : handleEditStart}>
						{editing ? (
							<Checkmark width={24} height={24} color="gray1" />
						) : (
							<SortAscendingIcon color="gray1" />
						)}
					</TouchableOpacity>
				)}
			</View>
			<View ref={widgetsContainer}>{widgetsArray.map(renderFlat)}</View>
			<TouchableOpacity style={styles.add} onPress={onAdd}>
				<View color="green16" style={styles.iconCircle}>
					<PlusIcon height={16} color="green" />
				</View>
				<Text01M>Add Widget</Text01M>
			</TouchableOpacity>
			<Modal
				transparent={true}
				visible={editing}
				onRequestClose={handleEditEnd}>
				<TouchableOpacity
					style={styles.backdrop}
					onPress={handleEditEnd}
					activeOpacity={0}
				/>
				{editing && wcm && (
					<AnimatedView
						entering={FadeIn}
						exiting={FadeOut}
						style={[
							styles.absolute,
							{
								left: wcm.pageX,
								top: wcm.pageY,
								width: wcm.width,
							},
						]}>
						{/* we need to wrap DraggableFlatList with GestureHandlerRootView, otherwise Gestures are not working in <Modal for Android */}
						<GestureHandlerRootView>
							<DraggableFlatList
								data={widgetsArray}
								keyExtractor={(item): string => item[0]}
								renderItem={renderEditing}
								onDragEnd={handleDragEnd}
								activationDistance={1}
							/>
						</GestureHandlerRootView>
					</AnimatedView>
				)}
			</Modal>
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
	backdrop: {
		width: '100%',
		height: '100%',
		opacity: 0,
	},
	absolute: {
		position: 'absolute',
	},
});

export default memo(Widgets);
