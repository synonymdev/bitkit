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
	View,
	ViewStyle,
	RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlatList, GestureType } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';

import { Caption13Up, BodyM, BodySSB } from '../../styles/text';
import Button from '../../components/Button';
import ListItem from './ListItem';
import useColors from '../../hooks/colors';
import { useAppSelector } from '../../hooks/redux';
import { refreshWallet } from '../../utils/wallet';
import {
	groupActivityItems,
	filterActivityItems,
	TActivityFilter,
} from '../../utils/activity';
import { RootNavigationProp } from '../../navigation/types';
import { activityItemsSelector } from '../../store/reselect/activity';
import { tagsSelector } from '../../store/reselect/metadata';
import { IActivityItem } from '../../store/types/activity';

const ListFooter = ({ showButton }: { showButton?: boolean }): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();

	const onPress = (): void => {
		navigation.navigate('Wallet', { screen: 'ActivityFiltered' });
	};

	if (showButton) {
		return (
			<>
				<Button
					style={styles.button}
					text={<BodySSB color="white80">{t('activity_show_all')}</BodySSB>}
					size="large"
					variant="transparent"
					testID="ActivityShowAll"
					onPress={onPress}
				/>
				<View style={styles.bottomSpacer} />
			</>
		);
	}

	return <View style={styles.bottomSpacer} />;
};

const ActivityList = ({
	style,
	panGestureRef,
	contentContainerStyle,
	progressViewOffset,
	filter = {},
	showFooterButton,
	onScroll,
}: {
	style?: StyleProp<ViewStyle>;
	panGestureRef?: MutableRefObject<GestureType>;
	contentContainerStyle?: StyleProp<ViewStyle>;
	progressViewOffset?: number;
	filter?: TActivityFilter;
	showFooterButton?: boolean;
	onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}): ReactElement => {
	const colors = useColors();
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
					<Caption13Up key={item} style={styles.category} color="white50">
						{item}
					</Caption13Up>
				);
			}

			return (
				<ListItem
					key={item.id}
					item={item}
					testID={`Activity-${index}`}
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
			contentContainerStyle={contentContainerStyle}
			data={groupedItems}
			simultaneousHandlers={simultaneousHandlers}
			showsVerticalScrollIndicator={false}
			renderItem={renderItem}
			keyExtractor={(item): string => {
				return typeof item === 'string' ? item : item.id;
			}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					progressViewOffset={progressViewOffset}
					tintColor={colors.refreshControl}
					onRefresh={onRefresh}
				/>
			}
			ListEmptyComponent={
				<BodyM style={styles.empty} color="white50">
					{t('activity_no')}
				</BodyM>
			}
			ListFooterComponent={<ListFooter showButton={showFooterButton} />}
			onScroll={onScroll}
		/>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingTop: 20,
	},
	category: {
		marginBottom: 16,
	},
	empty: {
		marginBottom: 32,
	},
	button: {
		marginTop: -24,
		marginBottom: 16,
	},
	bottomSpacer: {
		height: 120,
	},
});

export default memo(ActivityList);
