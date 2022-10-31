import React, {
	memo,
	ReactElement,
	useCallback,
	useState,
	useMemo,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import {
	FlatList,
	NativeScrollEvent,
	NativeSyntheticEvent,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';
import { useSelector } from 'react-redux';

import {
	Caption13Up,
	RefreshControl,
	Subtitle,
	View,
} from '../../styles/components';
import Store from '../../store/types';
import { refreshWallet } from '../../utils/wallet';
import { groupActivityItems, filterActivityItems } from '../../utils/activity';
import ListItem from './ListItem';
import { RootNavigationProp } from '../../navigation/types';
import { formatBoostedActivityItems } from '../../utils/boost';

const ListHeaderComponent = memo(
	(): ReactElement => {
		return (
			<View style={styles.header} color={'transparent'}>
				<Subtitle>Activity</Subtitle>
			</View>
		);
	},
	() => true,
);

const ActivityList = ({
	onScroll,
	style,
	contentContainerStyle,
	progressViewOffset,
	showTitle = true,
	filter,
}: {
	onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
	style?: StyleProp<ViewStyle> | undefined;
	contentContainerStyle?: StyleProp<ViewStyle> | undefined;
	progressViewOffset?: number | undefined;
	showTitle?: boolean;
	filter?: {};
}): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const boostedTransactions = useSelector(
		(state: Store) =>
			state.wallet.wallets[selectedWallet].boostedTransactions[selectedNetwork],
	);
	const items = useSelector((state: Store) => state.activity.items);
	const tags = useSelector((state: Store) => state.metadata.tags);
	const formattedBoostItems = useMemo(() => {
		return formatBoostedActivityItems({
			items,
			boostedTransactions,
			selectedWallet,
			selectedNetwork,
		});
	}, [boostedTransactions, items, selectedNetwork, selectedWallet]);
	const groupedItems = useMemo(() => {
		// If a filter is applied, pass all items through. Otherwise, remove boosted txs.
		const activityItems = filterActivityItems(
			formattedBoostItems,
			tags,
			filter ?? {},
		);
		// group items by categories: today, yesterday, this month, this year, earlier
		// and attach to them formattedDate
		return groupActivityItems(activityItems);
	}, [filter, formattedBoostItems, tags]);

	const [refreshing, setRefreshing] = useState(false);

	const renderItem = useCallback(
		({ item }): ReactElement => {
			if (typeof item === 'string') {
				return (
					<Caption13Up color="gray1" style={styles.category} key={item}>
						{item}
					</Caption13Up>
				);
			}

			return (
				<ListItem
					key={item.id}
					item={item}
					onPress={(): void =>
						navigation.navigate('ActivityDetail', { activityItem: item })
					}
				/>
			);
		},
		[navigation],
	);

	const onRefresh = async (): Promise<void> => {
		setRefreshing(true);
		//Refresh wallet
		await refreshWallet({});
		setRefreshing(false);
	};

	return (
		<FlatList
			onScroll={onScroll}
			style={[styles.content, style]}
			contentContainerStyle={contentContainerStyle}
			data={groupedItems}
			renderItem={renderItem}
			keyExtractor={(item): string =>
				typeof item === 'string' ? item : item.id
			}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					progressViewOffset={progressViewOffset}
				/>
			}
			ListHeaderComponent={showTitle ? ListHeaderComponent : undefined}
		/>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingTop: 20,
		paddingBottom: 100,
	},
	category: {
		marginBottom: 16,
	},
	header: {
		marginBottom: 23,
	},
});

export default memo(ActivityList);
