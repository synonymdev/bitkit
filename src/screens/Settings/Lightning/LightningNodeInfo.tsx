import React, { memo, ReactElement, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	TouchableOpacity,
} from '../../../styles/components';
import { Subtitle, Caption13Up } from '../../../styles/text';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import { getNodeId } from '../../../utils/lightning';
import { showSuccessNotification } from '../../../utils/notifications';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import { SettingsScreenProps } from '../../../navigation/types';

const LightningNodeInfo = ({
	navigation,
}: SettingsScreenProps<'LightningNodeInfo'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const [nodeId, setNodeId] = useState('');
	const [error, setError] = useState('');
	const selectedNetwork = useSelector(selectedNetworkSelector);

	useEffect(() => {
		(async (): Promise<void> => {
			const response = await getNodeId();
			if (response.isOk()) {
				setNodeId(response.value);
			} else {
				console.log('Error getting NodeId', response.error.message);
				setError(t('node_failed'));
			}
		})();
	}, [selectedNetwork, t]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={t('node_info')}
				displayBackButton
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			<View style={styles.content}>
				{!error && (
					<TouchableOpacity
						onPress={(): void => {
							Clipboard.setString(nodeId);
							showSuccessNotification({
								title: t('copied'),
								message: t('node_id_copied'),
							});
						}}
						testID="LDKNodeID">
						<Caption13Up style={styles.label} color="gray1">
							{t('node_id')}
						</Caption13Up>
						<Subtitle>{nodeId}</Subtitle>
					</TouchableOpacity>
				)}

				{!!error && (
					<>
						<View>
							<Caption13Up style={styles.label} color="gray1">
								{t('node_id')}
							</Caption13Up>
							<Subtitle color="red">{t('node_disconnected')}</Subtitle>
						</View>
						<View style={styles.error}>
							<Subtitle>{error}</Subtitle>
						</View>
					</>
				)}
			</View>

			<SafeAreaInsets type="bottom" />
		</ThemedView>
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
