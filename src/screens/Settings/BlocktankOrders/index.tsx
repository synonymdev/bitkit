import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { View as ThemedView } from '../../../styles/components';
import SettingsView from '../SettingsView';
import Store from '../../../store/types';
import { IListData } from '../../../components/List';
import type { SettingsScreenProps } from '../../../navigation/types';

const BlocktankOrders = ({
	navigation,
}: SettingsScreenProps<'BlocktankOrders'>): ReactElement => {
	const blocktankOrders = useSelector((state: Store) => state.blocktank.orders);

	const [blocktankOrderList, setBlocktankOrderList] = useState<IListData[]>([]);

	const setupBlocktankOrderList = useCallback(async (): Promise<void> => {
		let listData: IListData = {
			title: 'Orders',
			data: [],
		};
		await Promise.all(
			blocktankOrders.map((blocktankOrder) => {
				const createdAt = new Date(blocktankOrder.created_at).toLocaleString(
					undefined,
					{
						year: 'numeric',
						month: 'numeric',
						day: 'numeric',
						hour: 'numeric',
						minute: 'numeric',
					},
				);
				const onPress = (): void => {
					navigation.push('BlocktankOrderDetails', { blocktankOrder });
				};
				listData.data.push({
					title: createdAt,
					description: blocktankOrder._id,
					value: blocktankOrder.stateMessage,
					type: 'textButton',
					onPress,
				});
			}),
		);
		setBlocktankOrderList([listData]);
	}, [blocktankOrders, navigation]);

	useEffect(() => {
		setupBlocktankOrderList().then();
	}, [setupBlocktankOrderList]);

	return (
		<ThemedView style={styles.container}>
			<SettingsView
				title="Blocktank Orders"
				listData={blocktankOrderList}
				showBackNavigation={true}
				fullHeight={false}
			/>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default memo(BlocktankOrders);
