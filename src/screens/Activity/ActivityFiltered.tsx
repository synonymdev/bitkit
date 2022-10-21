import React, { ReactElement, memo, useMemo, useState } from 'react';
import {
	StyleSheet,
	TouchableOpacity,
	View,
	GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View as ThemedView, Caption13M } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SearchInput from '../../components/SearchInput';
import ActivityList from './ActivityList';
import BlurView from '../../components/BlurView';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import FilterAccessory from '../../components/FilterAccessory';
import Tag from '../../components/Tag';
import useColors from '../../hooks/colors';
import { EPaymentType } from '../../store/types/wallet';

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

const filterTabs = {
	all: {},
	sent: { txType: EPaymentType.sent },
	received: { txType: EPaymentType.received },
	instant: { types: ['lightning'] },
};

const filterTabsLabels = {
	all: 'All',
	sent: 'Sent',
	received: 'Received',
	instant: 'Instant',
};

const ActivityFiltered = (): ReactElement => {
	const [tab, setTab] = useState<string>('all');
	const [search, setSearch] = useState<string>('');
	const [tags, setTags] = useState<Array<string>>([]);
	const filter = useMemo(
		() => ({ ...filterTabs[tab], search, tags }),
		[tab, search, tags],
	);
	const insets = useSafeAreaInsets();
	const [radiusContainerHeight, setRadiusContainerHeight] = useState(0);
	const activityPadding = useMemo(
		() => ({ paddingTop: radiusContainerHeight, paddingBottom: insets.bottom }),
		[radiusContainerHeight, insets.bottom],
	);

	const addTag = (tag): void => setTags((t) => [...t, tag]);
	const removeTag = (tag): void => setTags((t) => t.filter((x) => x !== tag));

	return (
		<>
			<ThemedView style={styles.container}>
				<View style={styles.txListContainer}>
					<ActivityList
						style={styles.txList}
						showTitle={false}
						contentContainerStyle={activityPadding}
						progressViewOffset={radiusContainerHeight + 10}
						filter={filter}
					/>
				</View>

				<View
					style={styles.radiusContainer}
					onLayout={(e): void => {
						const hh = e.nativeEvent.layout.height;
						setRadiusContainerHeight((h) => (h === 0 ? hh : h));
					}}>
					<BlurView>
						<SafeAreaInsets type="top" />
						<NavigationHeader title="All Activity" />
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
								{Object.entries(filterTabsLabels).map(([key, label]) => (
									<Tab
										key={key}
										text={label}
										active={tab === key}
										onPress={(): void => setTab(key)}
									/>
								))}
							</View>
						</View>
					</BlurView>
				</View>
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
