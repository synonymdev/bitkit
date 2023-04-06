import React, { ReactElement, memo, useMemo, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import {
	StyleSheet,
	TouchableOpacity,
	View,
	GestureResponderEvent,
	Keyboard,
	ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { Caption13M } from '../../styles/text';
import { CalendarIcon, TagIcon } from '../../styles/icons';
import NavigationHeader from '../../components/NavigationHeader';
import SearchInput from '../../components/SearchInput';
import ActivityList from './ActivityList';
import BlurView from '../../components/BlurView';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Tag from '../../components/Tag';
import useColors from '../../hooks/colors';
import { EPaymentType } from '../../store/types/wallet';
import DetectSwipe from '../../components/DetectSwipe';
import type { WalletScreenProps } from '../../navigation/types';
import TimeRangePrompt from './TimeRangePrompt';
import { showBottomSheet, closeBottomSheet } from '../../store/actions/ui';
import TagsPrompt from './TagsPrompt';

const tabs = [
	{ id: 'all', filter: {} },
	{ id: 'sent', filter: { txType: EPaymentType.sent } },
	{ id: 'received', filter: { txType: EPaymentType.received } },
	{ id: 'instant', filter: { types: ['lightning'] } },
];

const Tab = ({
	text,
	active = false,
	onPress,
	testID,
}: {
	text: string;
	active?: boolean;
	onPress: (event: GestureResponderEvent) => void;
	testID?: string;
}): ReactElement => {
	const colors = useColors();
	const style = useMemo(
		() => ({
			borderColor: active ? colors.brand : colors.gray1,
		}),
		[active, colors],
	);

	return (
		<TouchableOpacity
			style={[styles.tab, style]}
			onPress={onPress}
			testID={testID}>
			<Caption13M color={active ? 'white' : 'gray1'}>{text}</Caption13M>
		</TouchableOpacity>
	);
};

const ActivityFiltered = ({
	navigation,
}: WalletScreenProps<'ActivityFiltered'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const insets = useSafeAreaInsets();
	const panGestureRef = useRef<GestureType>(Gesture.Pan());
	const [radiusContainerHeight, setRadiusContainerHeight] = useState(0);
	const [currentTab, setCurrentTab] = useState(0);
	const [search, setSearch] = useState('');
	const [timerange, setTimerange] = useState([]);
	const [tags, setTags] = useState<string[]>([]);

	const filter = useMemo(() => {
		return { ...tabs[currentTab].filter, search, tags, timerange };
	}, [currentTab, search, tags, timerange]);

	const activityPadding = useMemo(() => {
		return {
			paddingTop: radiusContainerHeight,
			// add space for TabBar
			paddingBottom: insets.bottom + 100,
		};
	}, [radiusContainerHeight, insets.bottom]);

	const addTag = (tag: string): void => {
		setTags((tg) => [...tg, tag]);
		closeBottomSheet('tagsPrompt');
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
						<SafeAreaInsets type="top" />
						<NavigationHeader
							title={t('activity_all')}
							onClosePress={navigation.popToTop}
						/>
						<View style={styles.formContainer}>
							<SearchInput
								style={styles.searchInput}
								value={search}
								onChangeText={setSearch}>
								<View style={styles.searchButtons}>
									{tags.length > 0 && (
										<ScrollView
											horizontal={true}
											showsHorizontalScrollIndicator={false}
											style={styles.tags}>
											{tags.map((tg) => (
												<Tag
													style={styles.tag}
													key={tg}
													value={tg}
													onClose={(): void => removeTag(tg)}
													testID={tg}
												/>
											))}
										</ScrollView>
									)}
									<TouchableOpacity
										style={styles.filterButton}
										onPress={(): void => {
											Keyboard.dismiss();
											showBottomSheet('tagsPrompt');
										}}
										testID="TagsPrompt">
										<TagIcon
											height={25}
											width={25}
											color={tags.length === 0 ? 'gray1' : 'brand'}
										/>
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.filterButton}
										onPress={(): void => {
											Keyboard.dismiss();
											showBottomSheet('timeRangePrompt');
										}}
										testID="TimeRangePrompt">
										<CalendarIcon
											height={25}
											width={25}
											color={timerange.length === 0 ? 'gray1' : 'brand'}
										/>
									</TouchableOpacity>
								</View>
							</SearchInput>
							<View style={styles.tabContainer}>
								{tabs.map((tab, index) => (
									<Tab
										key={tab.id}
										text={t('activity_tabs.' + tab.id)}
										active={currentTab === index}
										onPress={(): void => setCurrentTab(index)}
										testID={`Tab-${tab.id}`}
									/>
								))}
							</View>
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
							showTitle={false}
							contentContainerStyle={activityPadding}
							progressViewOffset={radiusContainerHeight + 10}
							filter={filter}
						/>
					</View>
				</DetectSwipe>
			</ThemedView>
			<TimeRangePrompt onChange={setTimerange} />
			<TagsPrompt tags={tags} onAddTag={addTag} />
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
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
	tabContainer: {
		marginHorizontal: -2,
		flexDirection: 'row',
	},
	tab: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 4,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 4,
		borderBottomWidth: 2,
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
