import React, {
	memo,
	ReactElement,
	ReactNode,
	useCallback,
	useMemo,
} from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { Subtitle, Text01M } from '../../styles/components';
import Store from '../../store/types';
import { groupActivityItems } from '../../utils/activity';
import Button from '../../components/Button';
import { RootNavigationProp } from '../../navigation/types';
import { toggleView } from '../../store/actions/user';
import { formatBoostedActivityItems } from '../../utils/boost';
import ListItem, { EmptyItem } from './ListItem';

const MAX_ACTIVITY_ITEMS = 3;

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
		const activityItems = boostFilteredItems.slice(0, MAX_ACTIVITY_ITEMS);
		return groupActivityItems(activityItems);
	}, [boostFilteredItems]);

	const renderItem = useCallback(
		({ item }): ReactNode => {
			if (typeof item === 'string') {
				return;
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
	header: {
		marginBottom: 23,
	},
});

export default memo(ActivityList);
