import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';
import Url from 'url-parse';
import { useTranslation } from 'react-i18next';

import { View, TextInput, ScrollView } from '../../../styles/components';
import { Caption13Up, Text01S, Text02S } from '../../../styles/text';
import { ScanIcon } from '../../../styles/icons';
import { updateSettings } from '../../../store/actions/settings';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import SwitchRow from '../../../components/SwitchRow';
import Button from '../../../components/Button';
import { showToast } from '../../../utils/notifications';
import { saveProfile2, updateSlashPayConfig2 } from '../../../utils/slashtags2';
import type { SettingsScreenProps } from '../../../navigation/types';
import { __WEB_RELAY__ } from '../../../constants/env';
import {
	useProfile2,
	useSelectedSlashtag2,
	useSlashtags2,
} from '../../../hooks/slashtags2';

const validateInput = (
	url: string,
	t: (error: string) => void,
): Result<string> => {
	let error;

	if (!url) {
		error = t('wr.error_url');
	} else if (new Url(url).protocol !== 'https:') {
		error = t('wr.error_https');
	}

	if (error) {
		return err(error);
	}
	return ok('');
};

const WebRelay = ({
	navigation,
}: SettingsScreenProps<'WebRelay'>): ReactElement => {
	const { t } = useTranslation('settings');
	const {
		webRelayClient,
		webRelayUrl,
		isWebRelayTrusted,
		profile: slashtagsProfile,
	} = useSlashtags2();
	const { url: myProfileUrl } = useSelectedSlashtag2();
	const { profile } = useProfile2(myProfileUrl);

	const [loading, setLoading] = useState(false);
	const [url, setUrl] = useState(webRelayUrl);
	const [updated, setUpdated] = useState(0);

	const connectAndSave = async (newUrl: string): Promise<void> => {
		setLoading(true);

		try {
			const validityCheck = validateInput(newUrl, t);
			if (validityCheck.isErr()) {
				showToast({
					type: 'error',
					title: t('wr.error_wr'),
					description: validityCheck.error.message,
				});
				return;
			}

			// query /healthcheck
			const response = await fetch(newUrl + '/health-check?format=json');
			if (response.status !== 200) {
				showToast({
					type: 'error',
					title: t('wr.error_wr'),
					description: t('wr.error_healthcheck'),
				});
				return;
			}
			updateSettings({ webRelay: newUrl });
			setUpdated((prev) => prev + 1);
			showToast({
				type: 'success',
				title: t('wr.url_updated_title'),
				description: t('wr.url_updated_message', { url: newUrl }),
			});
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	// update Profile and Slashpay when web relay changes
	useEffect(() => {
		// only run if updated
		if (updated === 0) {
			return;
		}

		if (Object.keys(profile).length === 0) {
			return;
		}

		saveProfile2(myProfileUrl, profile, slashtagsProfile).then((res) => {
			if (res.isOk()) {
				return;
			}
			showToast({
				type: 'error',
				title: t('slashtags:error_saving_profile'),
				description: res.error.message,
			});
		});

		updateSlashPayConfig2({});

		// ignore "profile" here
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [updated, webRelayClient, myProfileUrl, slashtagsProfile, t]);

	const resetToDefault = (): void => {
		setUrl(__WEB_RELAY__);
	};

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner', { onScan: connectAndSave });
	};

	const onToggle = (): void => {
		updateSettings({ isWebRelayTrusted: !isWebRelayTrusted });
	};

	const hasEdited = webRelayUrl !== url;

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('adv.web_relay')}
				actionIcon={<ScanIcon color="white" width={20} height={20} />}
				onActionPress={navigateToScanner}
			/>
			<ScrollView contentContainerStyle={styles.content} bounces={false}>
				<Text01S color="gray1">{t('es.connected_to')}</Text01S>
				<View style={styles.row}>
					<View style={styles.connectedPeer} testID="Status">
						<Text01S
							color="green"
							testID="ConnectedUrl"
							accessibilityLabel={webRelayUrl}>
							{webRelayUrl}
						</Text01S>
					</View>
				</View>

				<Caption13Up color="gray1" style={styles.label}>
					{t('es.host')}
				</Caption13Up>
				<TextInput
					style={styles.textInput}
					value={url}
					textAlignVertical="center"
					underlineColorAndroid="transparent"
					autoCapitalize="none"
					autoComplete="off"
					keyboardType="default"
					autoCorrect={false}
					onChangeText={setUrl}
					returnKeyType="done"
					testID="UrlInput"
				/>

				<View style={styles.switch}>
					<SwitchRow
						isEnabled={isWebRelayTrusted}
						showDivider={false}
						onPress={onToggle}>
						<Text01S>{t('wr.trust')}</Text01S>
						<Text02S color="gray1">{t('wr.trust_description')}</Text02S>
					</SwitchRow>
				</View>

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('es.button_reset')}
						variant="secondary"
						size="large"
						testID="ResetToDefault"
						onPress={resetToDefault}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						text={t('es.button_connect')}
						size="large"
						loading={loading}
						disabled={!hasEdited}
						testID="ConnectToUrl"
						onPress={(): void => {
							connectAndSave(url);
						}}
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
		marginTop: 12,
		marginBottom: 16,
	},
	switch: {
		marginBottom: 16,
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

export default memo(WebRelay);
