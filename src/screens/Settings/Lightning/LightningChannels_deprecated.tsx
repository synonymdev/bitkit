import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { TouchableOpacity } from '../../../styles/components';
import { Text } from '../../../styles/text';
import { Feather } from '../../../styles/icons';
import List from '../../../components/List';
import { truncate } from '../../../utils/helpers';
import SafeAreaView from '../../../components/SafeAreaView';
import { blocktankNodeInfoSelector } from '../../../store/reselect/blocktank';

const LightningChannels = ({ navigation }): ReactElement => {
	const [channelList] = useState<any[]>([]);

	const [peerList] = useState<any[]>([]);
	const nodeInfo = useSelector(blocktankNodeInfoSelector);

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
