import React, { memo, ReactElement, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';

import {
	View as ThemedView,
	TouchableOpacity,
} from '../../../styles/components';
import { Subtitle, Caption13Up } from '../../../styles/text';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { getNodeId } from '../../../utils/lightning';
import { showToast } from '../../../utils/notifications';

const LightningNodeInfo = (): ReactElement => {
	const { t } = useTranslation('lightning');
	const [nodeId, setNodeId] = useState('');
	const [error, setError] = useState('');

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
	}, [t]);

	const onCopy = (): void => {
		Clipboard.setString(nodeId);
		showToast({
			type: 'success',
			title: t('copied'),
			description: nodeId,
		});
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('node_info')} />

			<View style={styles.content}>
				<View style={styles.label}>
					<Caption13Up color="secondary">{t('node_id')}</Caption13Up>
				</View>

				{!error && (
					<TouchableOpacity activeOpacity={0.7} onPress={onCopy}>
						<Subtitle testID="LDKNodeID" accessibilityLabel={nodeId}>
							{nodeId}
						</Subtitle>
					</TouchableOpacity>
				)}

				{!!error && (
					<>
						<Subtitle color="red">{t('node_disconnected')}</Subtitle>
						<View style={styles.error}>
							<Subtitle>{error}</Subtitle>
						</View>
					</>
				)}
			</View>

			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	label: {
		justifyContent: 'center',
		height: 40,
	},
	error: {
		marginTop: 32,
	},
});

export default memo(LightningNodeInfo);
