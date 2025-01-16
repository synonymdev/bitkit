import { useNavigation } from '@react-navigation/native';
import React, {
	memo,
	ReactElement,
	ReactNode,
	useCallback,
	useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Button from '../../components/buttons/Button';
import { useAppSelector } from '../../hooks/redux';
import type { RootNavigationProp } from '../../navigation/types';
import { activityItemsSelector } from '../../store/reselect/activity';
import { EActivityType, IActivityItem } from '../../store/types/activity';
import { showBottomSheet } from '../../store/utils/ui';
import { Caption13Up } from '../../styles/text';
import { groupActivityItems } from '../../utils/activity';
import ListItem, { EmptyItem } from './ListItem';

const MAX_ACTIVITY_ITEMS = 3;

const ActivityListShort = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const items = useAppSelector(activityItemsSelector);

	const groupedItems = useMemo(() => {
		const sliced = items.slice(0, MAX_ACTIVITY_ITEMS);
		return groupActivityItems(sliced);
	}, [items]);

	const droppedItems = useMemo(() => {
		const dropped = items.filter((item) => {
			return item.activityType === EActivityType.onchain && !item.exists;
		});
		return dropped;
	}, [items]);

	const renderItem = useCallback(
		({
			item,
			index,
		}: {
			item: string | IActivityItem;
			index: number;
		}): ReactNode => {
			if (typeof item === 'string') {
				return;
			}

			return (
				<ListItem
					key={item.id}
					item={item}
					testID={`ActivityShort-${index}`}
					onPress={(): void => {
						navigation.navigate('ActivityDetail', { id: item.id });
					}}
				/>
			);
		},
		[navigation],
	);

	const navigateToReceive = useCallback((): void => {
		showBottomSheet('receiveNavigation');
	}, []);

	const navigateToActivityFiltered = useCallback((): void => {
		navigation.navigate('Wallet', { screen: 'ActivityFiltered' });
	}, [navigation]);

	return (
		<View style={styles.content}>
			<Caption13Up style={styles.title} color="secondary">
				{t('activity')}

				{droppedItems.length !== 0 && (
					<Caption13Up color="red">
						{' '}
						({droppedItems.length} {t('activity_removed')})
					</Caption13Up>
				)}
			</Caption13Up>

			{groupedItems.length === 0 ? (
				<EmptyItem onPress={navigateToReceive} />
			) : (
				<>
					{groupedItems.map((item, index) => (
						<React.Fragment key={index}>
							{renderItem({ item, index })}
						</React.Fragment>
					))}
					<Button
						style={styles.button}
						text={t('activity_show_all')}
						size="large"
						variant="tertiary"
						testID="ActivityShowAll"
						onPress={navigateToActivityFiltered}
					/>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingTop: 32,
		marginBottom: 32,
	},
	title: {
		marginBottom: 23,
	},
	button: {
		marginTop: -24,
	},
});

export default memo(ActivityListShort);
