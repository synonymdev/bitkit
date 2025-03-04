import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { EPaymentType } from 'beignet';
import React, { ReactElement, memo, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

import BlurView from '../../components/BlurView';
import DetectSwipe from '../../components/DetectSwipe';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import SearchInput from '../../components/SearchInput';
import Tabs, { TTab } from '../../components/Tabs';
import Tag from '../../components/Tag';
import { useAppDispatch } from '../../hooks/redux';
import { closeSheet } from '../../store/slices/ui';
import { showBottomSheet } from '../../store/utils/ui';
import { ScrollView, View as ThemedView } from '../../styles/components';
import { CalendarIcon, TagIcon } from '../../styles/icons';
import ActivityList from './ActivityList';
import TagsPrompt from './TagsPrompt';
import TimeRangePrompt from './TimeRangePrompt';

const tabs: TTab[] = [
	{ id: 'all', filter: { includeTransfers: true } },
	{ id: 'sent', filter: { txType: EPaymentType.sent } },
	{ id: 'received', filter: { txType: EPaymentType.received } },
	{ id: 'other', filter: { includeTransfers: true, onlyTransfers: true } },
];

const Glow = ({
	size,
}: {
	size: SharedValue<{ width: number; height: number }>;
}): ReactElement => {
	return (
		<Rect x={0} y={0} width={size.value.width} height={size.value.width}>
			<LinearGradient
				start={vec(0, 0)}
				end={vec(size.value.width, 0)}
				positions={[0, 1]}
				colors={['#1e1e1e', '#161616']}
			/>
		</Rect>
	);
};

const ActivityFiltered = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const dispatch = useAppDispatch();
	const size = useSharedValue({ width: 0, height: 0 });
	const panGestureRef = useRef<GestureType>(Gesture.Pan());
	const [radiusContainerHeight, setRadiusContainerHeight] = useState(0);
	const [currentTab, setCurrentTab] = useState(0);
	const [search, setSearch] = useState('');
	const [timerange, setTimerange] = useState<number[]>([]);
	const [tags, setTags] = useState<string[]>([]);

	const filter = useMemo(() => {
		return { ...tabs[currentTab].filter, search, tags, timerange };
	}, [currentTab, search, tags, timerange]);

	const activityPadding = useMemo(() => {
		return { paddingTop: radiusContainerHeight };
	}, [radiusContainerHeight]);

	const addTag = (tag: string): void => {
		setTags((tg) => [...tg, tag]);
		dispatch(closeSheet('tagsPrompt'));
	};
	const removeTag = (tag: string): void => {
		setTags((tg) => tg.filter((x) => x !== tag));
	};

	const onSwipeLeft = (): void => {
		if (currentTab < tabs.length - 1) {
			setCurrentTab((prevState) => prevState + 1);
		}
	};

	const onSwipeRight = (): void => {
		if (currentTab > 0) {
			setCurrentTab((prevState) => prevState - 1);
		}
	};

	return (
		<>
			<ThemedView style={styles.container}>
				<View
					style={styles.radiusContainer}
					onLayout={(e): void => {
						const hh = e.nativeEvent.layout.height;
						setRadiusContainerHeight((h) => (h === 0 ? hh : h));
					}}>
					<BlurView>
						<Canvas style={styles.glowCanvas} onSize={size}>
							<Glow size={size} />
						</Canvas>
						<SafeAreaInset type="top" />
						<NavigationHeader title={t('activity_all')} />
						<View style={styles.formContainer}>
							<SearchInput
								style={styles.searchInput}
								value={search}
								onChangeText={setSearch}>
								<View style={styles.searchButtons}>
									{tags.length > 0 && (
										<ScrollView
											style={styles.tags}
											color="transparent"
											horizontal={true}
											showsHorizontalScrollIndicator={false}>
											{tags.map((tag) => (
												<Tag
													key={tag}
													style={styles.tag}
													value={tag}
													onDelete={(): void => removeTag(tag)}
												/>
											))}
										</ScrollView>
									)}
									<TouchableOpacity
										style={styles.filterButton}
										activeOpacity={0.7}
										testID="TagsPrompt"
										onPress={(): void => {
											Keyboard.dismiss();
											showBottomSheet('tagsPrompt');
										}}>
										<TagIcon
											height={25}
											width={25}
											color={tags.length === 0 ? 'secondary' : 'brand'}
										/>
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.filterButton}
										activeOpacity={0.7}
										testID="TimeRangePrompt"
										onPress={(): void => {
											Keyboard.dismiss();
											showBottomSheet('timeRangePrompt');
										}}>
										<CalendarIcon
											height={25}
											width={25}
											color={timerange.length === 0 ? 'secondary' : 'brand'}
										/>
									</TouchableOpacity>
								</View>
							</SearchInput>
							<Tabs
								tabs={tabs}
								activeTab={currentTab}
								onPress={setCurrentTab}
							/>
						</View>
					</BlurView>
				</View>

				<DetectSwipe
					panGestureRef={panGestureRef}
					swipeLeftSensitivity={1500}
					swipeRightSensitivity={1500}
					onSwipeLeft={onSwipeLeft}
					onSwipeRight={onSwipeRight}>
					<View style={styles.txListContainer}>
						<ActivityList
							style={styles.txList}
							panGestureRef={panGestureRef}
							contentContainerStyle={activityPadding}
							progressViewOffset={radiusContainerHeight + 10}
							filter={filter}
						/>
					</View>
				</DetectSwipe>
			</ThemedView>

			{/* TODO: move these up the tree, causing slow down when navigating */}
			<TimeRangePrompt onChange={setTimerange} />
			<TagsPrompt tags={tags} onAddTag={addTag} />
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	glowCanvas: {
		width: '100%',
		height: '100%',
		position: 'absolute',
	},
	radiusContainer: {
		overflow: 'hidden',
		borderBottomRightRadius: 16,
		borderBottomLeftRadius: 16,
		zIndex: 1,
	},
	txListContainer: {
		flex: 1,
		position: 'absolute',
		width: '100%',
		height: '100%',
	},
	txList: {
		paddingHorizontal: 16,
	},
	formContainer: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 16,
	},
	searchInput: {
		marginBottom: 16,
	},
	tag: {
		marginRight: 8,
		marginVertical: 4,
	},
	searchButtons: {
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignContent: 'center',
		justifyContent: 'center',
		flex: 1,
		marginRight: 10,
	},
	tags: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		flexShrink: 1,
		alignSelf: 'center',
	},
	filterButton: {
		paddingHorizontal: 7,
		alignContent: 'center',
		justifyContent: 'center',
	},
});

export default memo(ActivityFiltered);
