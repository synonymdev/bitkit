import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import isEqual from 'lodash/isEqual';

import {
	View,
	TextInput,
	ScrollView,
	TouchableOpacity,
} from '../../../styles/components';
import { Text01S, Caption13Up } from '../../../styles/text';
import { ScanIcon } from '../../../styles/icons';
import { updateSettings } from '../../../store/actions/settings';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { rapidGossipSyncUrlSelector } from '../../../store/reselect/settings';
import Store from '../../../store/types';
import { defaultSettingsShape } from '../../../store/shapes/settings';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import type { SettingsScreenProps } from '../../../navigation/types';
import { setupLdk } from '../../../utils/lightning';
import { showToast } from '../../../utils/notifications';

const isValidURL = (data: string): boolean => {
	const pattern = new RegExp(
		'^(https?:\\/\\/)?' + // protocol
			'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
			'((\\d{1,3}\\.){3}\\d{1,3}))' + // IP (v4) address
			'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*', // port and path
		'i',
	);

	// wave through everything 'localhost' for development
	if (__DEV__ && data.includes('localhost')) {
		return true;
	}

	return !!pattern.test(data);
};

const RGSServer = ({
	navigation,
}: SettingsScreenProps<'RGSServer'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const defaultRGSServer = defaultSettingsShape.rapidGossipSyncUrl;
	const rapidGossipSyncUrl = useSelector((state: Store) =>
		rapidGossipSyncUrlSelector(state),
	);
	const [loading, setLoading] = useState(false);
	const [rgsUrl, setRGSUrl] = useState<string>(rapidGossipSyncUrl);

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner', { onScan });
	};

	const onScan = (data: string): void => {
		setRGSUrl(data);
	};

	const resetToDefault = (): void => {
		setRGSUrl(defaultRGSServer);
	};

	const connectToRGSServer = async (): Promise<void> => {
		setLoading(true);
		updateSettings({ rapidGossipSyncUrl: rgsUrl });
		await setupLdk({
			selectedWallet,
			selectedNetwork,
		});
		showToast({
			type: 'success',
			title: t('rgs.update_success_title'),
			description: t('rgs.update_success_description'),
		});
		setLoading(false);
	};

	// Compare against the current url
	const hasEdited = !isEqual(rgsUrl, rapidGossipSyncUrl);

	const handleConnectedPress = (): void => {
		setRGSUrl(rapidGossipSyncUrl);
	};

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('adv.rgs_server')}
				actionIcon={<ScanIcon color="white" width={20} height={20} />}
				onActionPress={navigateToScanner}
			/>
			<ScrollView contentContainerStyle={styles.content} bounces={false}>
				<TouchableOpacity activeOpacity={1} onPress={handleConnectedPress}>
					<>
						<Text01S color="gray1">{t('es.connected_to')}</Text01S>
						<View style={styles.row}>
							<View style={styles.connectedPeer} testID="Status">
								<Text01S color="green" testID="Connected">
									{rapidGossipSyncUrl}
								</Text01S>
							</View>
						</View>
					</>
				</TouchableOpacity>

				<Caption13Up color="gray1" style={styles.label}>
					{t('rgs.server_url')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={rgsUrl}
					placeholder=""
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="default"
					autoCorrect={false}
					onChangeText={(txt): void => {
						setRGSUrl(txt.trim());
					}}
					returnKeyType="done"
					testID="rgsUrl"
				/>

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('es.button_reset')}
						variant="secondary"
						size="large"
						testID="ResetToDefault"
						disabled={isEqual(defaultRGSServer, rgsUrl)}
						onPress={resetToDefault}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text={t('rgs.button_connect')}
						size="large"
						loading={loading}
						disabled={!hasEdited || !rgsUrl || !isValidURL(rgsUrl)}
						testID="ConnectToHost"
						onPress={connectToRGSServer}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		paddingBottom: 16,
		justifyContent: 'center',
	},
	label: {
		marginTop: 16,
		marginBottom: 4,
	},
	connectedPeer: {
		flex: 1.5,
	},
	textInput: {
		minHeight: 52,
		marginTop: 5,
	},
	buttons: {
		marginTop: 16,
		flexDirection: 'row',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(RGSServer);
