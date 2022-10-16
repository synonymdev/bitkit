import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';

import {
	Subtitle,
	Title,
	View,
	TouchableOpacity,
} from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import { getNodeId } from '../../../utils/lightning';
import { showSuccessNotification } from '../../../utils/notifications';
import Store from '../../../store/types';

const LightningNodeInfo = (): ReactElement => {
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const [nodeId, setNodeId] = useState('');

	useEffect(() => {
		(async (): Promise<void> => {
			const id = await getNodeId();
			if (id.isOk()) {
				setNodeId(id.value);
			} else {
				setNodeId(id.error.message);
			}
		})();
	}, [selectedNetwork]);

	return (
		<View style={styles.container} color="black">
			<SafeAreaInsets type="top" />
			<NavigationHeader displayBackButton />

			<View style={styles.content} color="black">
				<TouchableOpacity
					onPress={(): void => {
						Clipboard.setString(nodeId);
						showSuccessNotification({
							title: 'Copied LDK Node ID to Clipboard',
							message: nodeId,
						});
					}}
					color="black">
					<Title>LDK Node ID:</Title>
					<Subtitle>{nodeId}</Subtitle>
				</TouchableOpacity>
			</View>

			<SafeAreaInsets type="bottom" />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
	},
	content: {
		marginHorizontal: 20,
	},
});

export default memo(LightningNodeInfo);
