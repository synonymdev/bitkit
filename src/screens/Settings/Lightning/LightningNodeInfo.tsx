import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';

import {
	Subtitle,
	View,
	TouchableOpacity,
	Caption13Up,
} from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import { getNodeId } from '../../../utils/lightning';
import { showSuccessNotification } from '../../../utils/notifications';
import Store from '../../../store/types';

const LightningNodeInfo = (): ReactElement => {
	const [nodeId, setNodeId] = useState('');
	const [error, setError] = useState('');
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	useEffect(() => {
		(async (): Promise<void> => {
			const response = await getNodeId();
			if (response.isOk()) {
				setNodeId(response.value);
			} else {
				console.log('Error getting NodeId', response.error.message);
				setNodeId('disconnected');
				setError('Bitkit failed to establish a Lightning node connection.');
			}
		})();
	}, [selectedNetwork]);

	return (
		<View style={styles.container} color="black">
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Lightning Node Info" displayBackButton />

			<View style={styles.content} color="black">
				<TouchableOpacity
					onPress={(): void => {
						Clipboard.setString(nodeId);
						showSuccessNotification({
							title: 'Copied LDK Node ID to Clipboard',
							message: nodeId,
						});
					}}>
					<Caption13Up style={styles.label} color="gray1">
						LDK Node ID
					</Caption13Up>
					<Subtitle color={error && 'red'}>{nodeId}</Subtitle>
				</TouchableOpacity>

				{!!error && (
					<View style={styles.error}>
						<Subtitle>{error}</Subtitle>
					</View>
				)}
			</View>

			<SafeAreaInsets type="bottom" />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	label: {
		marginBottom: 8,
	},
	error: {
		marginTop: 32,
	},
});

export default memo(LightningNodeInfo);
