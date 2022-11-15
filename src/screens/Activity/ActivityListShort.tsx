import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { Caption13Up, Subtitle, Text01M } from '../../styles/components';
import Store from '../../store/types';
import { groupActivityItems } from '../../utils/activity';
import Button from '../../components/Button';
import { RootNavigationProp } from '../../navigation/types';
import { toggleView } from '../../store/actions/user';
import { formatBoostedActivityItems } from '../../utils/boost';
import ListItem, { EmptyItem } from './ListItem';

const ActivityList = (): ReactElement => {
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

	const boostFilteredItems = useMemo(() => {
		return formatBoostedActivityItems({
			items,
			boostedTransactions,
			selectedWallet,
			selectedNetwork,
		});
	}, [boostedTransactions, items, selectedNetwork, selectedWallet]);

	const groupedItems = useMemo(() => {
		const activityItems = boostFilteredItems.slice(0, 3);
		// group items by categories: today, yesterday, this month, this year, earlier
		// and attach to them formattedDate
		return groupActivityItems(activityItems);
	}, [boostFilteredItems]);

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
		<View style={styles.content}>
			<View style={styles.header}>
				<Subtitle>Activity</Subtitle>
			</View>

			{groupedItems.length === 0 ? (
				<EmptyItem
					onPress={(): void => {
						toggleView({
							view: 'receiveNavigation',
							data: {
								isOpen: true,
							},
						});
					}}
				/>
			) : (
				<>
					{groupedItems.map((item) => renderItem({ item }))}
					<Button
						text={<Text01M color="white8">Show All Activity</Text01M>}
						size="large"
						variant="transparent"
						onPress={(): void => {
							navigation.navigate('ActivityFiltered');
						}}
					/>
				</>
			)}
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
