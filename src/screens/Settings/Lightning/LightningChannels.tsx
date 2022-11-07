import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { Feather, Text, TouchableOpacity } from '../../../styles/components';
import List from '../../../components/List';
import Store from '../../../store/types';
import { truncate } from '../../../utils/helpers';
import SafeAreaView from '../../../components/SafeAreaView';

const LightningChannels = ({ navigation }): ReactElement => {
	const lightning = useSelector((state: Store) => state.lightning);
	const [channelList] = useState<any[]>([]);

	const [peerList] = useState<any[]>([]);
	const nodeInfo = useSelector(
		(state: Store) => state.blocktank.info?.node_info,
	);

	useEffect(() => {
		(async (): Promise<void> => {
			//TODO: Get & Set Channels
			//TODO: Get & Set Peers
		})();
	}, [lightning]);

	const ListData = [
		{
			title: 'Channels',
			data: channelList.map((channel) => {
				const { chanId, active } = channel;
				let title = `${chanId}\n`;
				title += active ? 'Active ✅' : 'Inactive ❌';

				return {
					title,
					type: 'button',
					onPress: async (): Promise<void> => {
						navigation.navigate('LightningChannelDetails', { channel });
					},
				};
			}),
		},
		{
			title: 'Peers',
			data: peerList.map((p) => ({
				title: `Pubkey: ${truncate(p.pubKey, 22)}${
					p.pubKey === nodeInfo?.public_key ? ' (Default node)' : ''
				}\nAddress: ${p.address}`,
				type: 'button',
				onPress: async (): Promise<void> => {},
			})),
		},
	];

	return (
		<SafeAreaView>
			<TouchableOpacity
				activeOpacity={0.7}
				onPress={navigation.goBack}
				style={styles.row}>
				<Feather style={{}} name="arrow-left" size={30} />
				<Text style={styles.backText}>Lightning channels</Text>
			</TouchableOpacity>
			{/* @ts-ignore */}
			<List data={ListData} />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 10,
		paddingVertical: 8,
	},
	backText: {
		fontSize: 20,
	},
});

export default memo(LightningChannels);
