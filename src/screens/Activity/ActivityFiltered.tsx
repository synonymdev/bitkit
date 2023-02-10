import React, { ReactElement, memo, useMemo, useState, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureType } from 'react-native-gesture-handler';
import {
	StyleSheet,
	TouchableOpacity,
	View,
	GestureResponderEvent,
} from 'react-native';

import { View as ThemedView } from '../../styles/components';
import { Caption13M } from '../../styles/text';
import NavigationHeader from '../../components/NavigationHeader';
import SearchInput from '../../components/SearchInput';
import ActivityList from './ActivityList';
import BlurView from '../../components/BlurView';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import FilterAccessory from '../../components/FilterAccessory';
import Tag from '../../components/Tag';
import useColors from '../../hooks/colors';
import { EPaymentType } from '../../store/types/wallet';
import DetectSwipe from '../../components/DetectSwipe';
import type { WalletScreenProps } from '../../navigation/types';

const tabs = [
	{ name: 'All', filter: {} },
	{ name: 'Sent', filter: { txType: EPaymentType.sent } },
	{ name: 'Received', filter: { txType: EPaymentType.received } },
	{ name: 'Instant', filter: { types: ['lightning'] } },
];

const Tab = ({
	text,
	active = false,
	onPress,
}: {
	text: string;
	active?: boolean;
	onPress: (event: GestureResponderEvent) => void;
}): ReactElement => {
	const colors = useColors();
	const style = useMemo(
		() => ({
			borderColor: active ? colors.brand : colors.gray1,
		}),
		[active, colors],
	);

	return (
		<TouchableOpacity style={[styles.tab, style]} onPress={onPress}>
			<Caption13M color={active ? 'white' : 'gray1'}>{text}</Caption13M>
		</TouchableOpacity>
	);
};

const ActivityFiltered = ({
	navigation,
}: WalletScreenProps<'ActivityFiltered'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const panGestureRef = useRef<GestureType>(Gesture.Pan());
	const [radiusContainerHeight, setRadiusContainerHeight] = useState(0);
	const [currentTab, setCurrentTab] = useState(0);
	const [search, setSearch] = useState('');
	const [tags, setTags] = useState<string[]>([]);

	const filter = useMemo(() => {
		return { ...tabs[currentTab].filter, search, tags };
	}, [currentTab, search, tags]);

	const activityPadding = useMemo(() => {
		return {
			paddingTop: radiusContainerHeight,
			// add space for TabBar
			paddingBottom: insets.bottom + 100,
		};
	}, [radiusContainerHeight, insets.bottom]);

	const addTag = (tag): void => setTags((t) => [...t, tag]);
	const removeTag = (tag): void => setTags((t) => t.filter((x) => x !== tag));

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
							title="All Activity"
							onClosePress={navigation.popToTop}
						/>
						<View style={styles.formContainer}>
							<SearchInput
								style={styles.searchInput}
								value={search}
								onChangeText={setSearch}>
								{tags.length > 0 && (
									<View style={styles.tags}>
										{tags.map((t) => (
											<Tag
												style={styles.tag}
												key={t}
												value={t}
												onClose={(): void => removeTag(t)}
											/>
										))}
									</View>
								)}
							</SearchInput>
							<View style={styles.tabContainer}>
								{tabs.map((tab, index) => (
									<Tab
										key={tab.name}
										text={tab.name}
										active={currentTab === index}
										onPress={(): void => setCurrentTab(index)}
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
			<FilterAccessory tags={tags} addTag={addTag} />
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
		marginBottom: 8,
	},
	tags: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 8,
	},
});

export default memo(ActivityFiltered);
