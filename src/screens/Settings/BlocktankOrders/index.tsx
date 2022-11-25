import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import {
	ClockIcon,
	LightningIcon,
	TimerSpeedIcon,
	View as ThemedView,
} from '../../../styles/components';
import SettingsView from '../SettingsView';
import Store from '../../../store/types';
import { IListData } from '../../../components/List';
import type { SettingsScreenProps } from '../../../navigation/types';
import type { SvgProps } from 'react-native-svg';

const title =
	'Bitkit Instant Payments are powered by Blocktank Lightning Service Provider.\n\n' +
	'Here is an overview of your recent Blocktank orders for instant spending balances.';

// possible order states
// https://github.com/synonymdev/blocktank-server/blob/master/src/Orders/Order.js
// CREATED: 0,
// PAID: 100,
// REFUNDED: 150,
// URI_SET: 200,
// OPENING: 300,
// CLOSING: 350,
// GIVE_UP: 400,
// EXPIRED: 410,
// REJECTED: 450,
// CLOSED: 450,
// OPEN: 500
export const getIcon = (state: number): React.FC<SvgProps> => {
	switch (state) {
		case 0:
		case 100:
		case 150:
		case 200:
		case 300:
		case 350:
			return (): ReactElement => (
				<ThemedView color="yellow16" style={styles.icon}>
					<ClockIcon color="yellow" width={16} height={16} />
				</ThemedView>
			);
		case 410:
			return (): ReactElement => (
				<ThemedView color="red16" style={styles.icon}>
					<TimerSpeedIcon color="red" width={16} height={16} />
				</ThemedView>
			);
		case 450:
		case 400:
			return (): ReactElement => (
				<ThemedView color="red16" style={styles.icon}>
					<LightningIcon color="red" width={16} height={16} />
				</ThemedView>
			);
		case 500:
			return (): ReactElement => (
				<ThemedView color="green16" style={styles.icon}>
					<LightningIcon color="green" width={16} height={16} />
				</ThemedView>
			);
		default:
			return (): ReactElement => (
				<ThemedView color="white1" style={styles.icon}>
					<LightningIcon color="gray1" width={16} height={16} />
				</ThemedView>
			);
	}
};

const BlocktankOrders = ({
	navigation,
}: SettingsScreenProps<'BlocktankOrders'>): ReactElement => {
	const blocktankOrders = useSelector((state: Store) => state.blocktank.orders);

	const [blocktankOrderList, setBlocktankOrderList] = useState<IListData[]>([]);

	const setupBlocktankOrderList = useCallback(async (): Promise<void> => {
		let listData: IListData = {
			data: [],
		};
		await Promise.all(
			blocktankOrders.map((blocktankOrder) => {
				const createdAt = new Date(blocktankOrder.created_at).toLocaleString(
					undefined,
					{
						month: 'short',
						day: 'numeric',
					},
				);
				const onPress = (): void => {
					navigation.push('BlocktankOrderDetails', { blocktankOrder });
				};
				listData.data.push({
					title: blocktankOrder.stateMessage,
					description: blocktankOrder._id,
					value: createdAt,
					type: 'textButton',
					onPress,
					Icon: getIcon(blocktankOrder.state),
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
				headerText={title}
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
	icon: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 16,
	},
});

export default memo(BlocktankOrders);
