import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { Caption13Up, Subtitle, Text01M, View } from '../../styles/components';
import Store from '../../store/types';
import { groupActivityItems } from '../../utils/activity';
import Button from '../../components/Button';
import ListItem from './ListItem';
import { RootNavigationProp } from '../../navigation/types';

const ActivityList = (): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();
	const items = useSelector((state: Store) => state.activity.items);
	const groupedItems = useMemo(() => {
		const activityItems = items.slice(0, 3);
		// group items by categories: today, yestarday, this month, this year, earlier
		// and attach to them formattedDate
		return groupActivityItems(activityItems);
	}, [items]);

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

	return (
		<View style={styles.content} color="transparent">
			<View style={styles.header} color="transparent">
				<Subtitle>Activity</Subtitle>
			</View>
			{groupedItems.map((item) => renderItem({ item }))}
			<Button
				text={<Text01M color="white8">Show All Activity</Text01M>}
				size="big"
				variant="transparent"
				onPress={(): void => {
					navigation.navigate('ActivityFiltered');
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	content: {
		paddingTop: 30,
		marginBottom: 16,
	},
	category: {
		marginBottom: 16,
	},
	header: {
		marginBottom: 23,
	},
});

export default memo(ActivityList);
