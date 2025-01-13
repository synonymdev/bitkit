import isEqual from 'lodash/isEqual';
import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import type { SettingsScreenProps } from '../../../navigation/types';
import { rapidGossipSyncUrlSelector } from '../../../store/reselect/settings';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import { initialSettingsState } from '../../../store/shapes/settings';
import { updateSettings } from '../../../store/slices/settings';
import useBreakpoints from '../../../styles/breakpoints';
import {
	ScrollView,
	TextInput,
	TouchableOpacity,
	View,
} from '../../../styles/components';
import { ScanIcon } from '../../../styles/icons';
import { BodyM, Caption13Up } from '../../../styles/text';
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
	const br = useBreakpoints();
	const dispatch = useAppDispatch();
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const defaultRGSServer = initialSettingsState.rapidGossipSyncUrl;
	const rapidGossipSyncUrl = useAppSelector((state) =>
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
		dispatch(updateSettings({ rapidGossipSyncUrl: rgsUrl }));
		const res = await setupLdk({
			selectedWallet,
			selectedNetwork,
		});
		if (res.isOk()) {
			showToast({
				type: 'success',
				title: t('rgs.update_success_title'),
				description: t('rgs.update_success_description'),
			});
		} else {
			showToast({
				type: 'error',
				title: t('wallet:ldk_start_error_title'),
				description: res.error.message,
			});
		}
		setLoading(false);
	};

	// Compare against the current url
	const hasEdited = !isEqual(rgsUrl, rapidGossipSyncUrl);

	const handleConnectedPress = (): void => {
		setRGSUrl(rapidGossipSyncUrl);
	};

	return (
		<View style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('adv.rgs_server')}
				showCloseButton={false}
				actionIcon={<ScanIcon color="white" width={20} height={20} />}
				onActionPress={navigateToScanner}
			/>
			<ScrollView contentContainerStyle={styles.content} bounces={false}>
				<TouchableOpacity activeOpacity={1} onPress={handleConnectedPress}>
					<>
						<BodyM color="secondary">{t('es.connected_to')}</BodyM>
						<View style={styles.connectedPeer} testID="Status">
							<BodyM color="green" testID="ConnectedUrl">
								{rapidGossipSyncUrl}
							</BodyM>
						</View>
					</>
				</TouchableOpacity>

				<Caption13Up color="secondary" style={styles.label}>
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
					testID="RGSUrl"
				/>

				<View style={[styles.buttons, br.up('sm') && styles.buttonsRow]}>
					<Button
						style={styles.button}
						text={t('es.button_reset')}
						variant="secondary"
						size="large"
						testID="ResetToDefault"
						disabled={isEqual(defaultRGSServer, rgsUrl)}
						onPress={resetToDefault}
					/>
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
	root: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	connectedPeer: {
		marginBottom: 16,
	},
	label: {
		marginTop: 16,
		marginBottom: 4,
	},
	textInput: {
		minHeight: 52,
		marginTop: 5,
	},
	buttons: {
		marginTop: 'auto',
		gap: 16,
	},
	buttonsRow: {
		flexDirection: 'row',
	},
	button: {
		flex: 1,
	},
});

export default memo(RGSServer);
