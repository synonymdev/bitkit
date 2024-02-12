import React, {
	memo,
	ReactElement,
	useCallback,
	useState,
	useMemo,
	MutableRefObject,
} from 'react';
import {
	NativeScrollEvent,
	NativeSyntheticEvent,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';
import { useAppSelector } from '../../hooks/redux';
import { useNavigation } from '@react-navigation/native';
import {
	FlatList,
	RefreshControl,
	GestureType,
} from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { Caption13Up, Text01S } from '../../styles/text';
import { refreshWallet } from '../../utils/wallet';
import {
	groupActivityItems,
	filterActivityItems,
	TActivityFilter,
} from '../../utils/activity';
import ListItem from './ListItem';
import { RootNavigationProp } from '../../navigation/types';
import { activityItemsSelector } from '../../store/reselect/activity';
import { tagsSelector } from '../../store/reselect/metadata';
import { IActivityItem } from '../../store/types/activity';

const ActivityList = ({
	style,
	panGestureRef,
	contentContainerStyle,
	progressViewOffset,
	filter = {},
	onScroll,
}: {
	style?: StyleProp<ViewStyle>;
	panGestureRef?: MutableRefObject<GestureType>;
	contentContainerStyle?: StyleProp<ViewStyle>;
	progressViewOffset?: number;
	filter?: TActivityFilter;
	onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const items = useAppSelector(activityItemsSelector);
	const tags = useAppSelector(tagsSelector);
	const [refreshing, setRefreshing] = useState(false);

	const groupedItems = useMemo(() => {
		// Apply search filter
		const filterItems = filterActivityItems(items, tags, filter);
		// Group items by categories: today, yesterday, this month, this year, earlier
		// and attach to them formattedDate
		return groupActivityItems(filterItems);
	}, [filter, items, tags]);

	const renderItem = useCallback(
		({
			item,
			index,
		}: {
			// eslint-disable-next-line react/no-unused-prop-types
			item: string | IActivityItem;
			// eslint-disable-next-line react/no-unused-prop-types
			index: number;
		}): ReactElement => {
			if (typeof item === 'string') {
				return (
					<Caption13Up color="gray1" style={styles.category} key={item}>
						{item}
					</Caption13Up>
				);
			}

			return (
				<ListItem
					testID={`Activity-${index}`}
					key={item.id}
					item={item}
					onPress={(): void => {
						navigation.navigate('ActivityDetail', { id: item.id });
					}}
				/>
			);
		},
		[navigation],
	);

	const onRefresh = async (): Promise<void> => {
		setRefreshing(true);
		await refreshWallet();
		setRefreshing(false);
	};

	const simultaneousHandlers = panGestureRef ? [panGestureRef] : [];

	return (
		<FlatList
			style={[styles.content, style]}
			simultaneousHandlers={simultaneousHandlers}
			contentContainerStyle={contentContainerStyle}
			showsVerticalScrollIndicator={false}
			data={groupedItems}
			renderItem={renderItem}
			onScroll={onScroll}
			keyExtractor={(item): string => {
				return typeof item === 'string' ? item : item.id;
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={onRefresh}
					progressViewOffset={progressViewOffset}
				/>
			}
			ListEmptyComponent={<Text01S color="gray1">{t('activity_no')}</Text01S>}
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
});

export default memo(ActivityList);
