import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { err, ok, Result } from '@synonymdev/result';
import Url from 'url-parse';
import { useTranslation } from 'react-i18next';

import { View, TextInput, ScrollView } from '../../../styles/components';
import { Caption13Up, BodyM } from '../../../styles/text';
import { ScanIcon } from '../../../styles/icons';
import { updateSettings } from '../../../store/slices/settings';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import { showToast } from '../../../utils/notifications';
import { saveProfile, updateSlashPayConfig } from '../../../utils/slashtags';
import type { SettingsScreenProps } from '../../../navigation/types';
import { __WEB_RELAY__ } from '../../../constants/env';
import { useAppDispatch } from '../../../hooks/redux';
import { useProfile, useSlashtags } from '../../../hooks/slashtags';

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
	const dispatch = useAppDispatch();
	const {
		webRelayClient,
		webRelayUrl,
		url: myProfileUrl,
		profile: slashtagsProfile,
	} = useSlashtags();
	const { profile } = useProfile(myProfileUrl);

	const [loading, setLoading] = useState(false);
	const [url, setUrl] = useState(webRelayUrl);
	const [updated, setUpdated] = useState(0);

	const connectAndSave = async (newUrl: string): Promise<void> => {
		setLoading(true);

		try {
			const validityCheck = validateInput(newUrl, t);
			if (validityCheck.isErr()) {
				showToast({
					type: 'warning',
					title: t('wr.error_wr'),
					description: validityCheck.error.message,
				});
				return;
			}

			// query /healthcheck
			const response = await fetch(newUrl + '/health-check?format=json');
			if (response.status !== 200) {
				showToast({
					type: 'warning',
					title: t('wr.error_wr'),
					description: t('wr.error_healthcheck'),
				});
				return;
			}
			dispatch(updateSettings({ webRelay: newUrl }));
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

		saveProfile(myProfileUrl, profile, slashtagsProfile).then((res) => {
			if (res.isOk()) {
				return;
			}
			showToast({
				type: 'warning',
				title: t('slashtags:error_saving_profile'),
				description: res.error.message,
			});
		});

		updateSlashPayConfig();

		// ignore "profile" here
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [updated, webRelayClient, myProfileUrl, slashtagsProfile, t]);

	const resetToDefault = (): void => {
		setUrl(__WEB_RELAY__);
	};

	const navigateToScanner = (): void => {
		navigation.navigate('Scanner', { onScan: connectAndSave });
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
				<BodyM color="secondary">{t('es.connected_to')}</BodyM>
				<View style={styles.connectedPeer} testID="WebRelayStatus">
					<BodyM
						color="green"
						testID="ConnectedUrl"
						accessibilityLabel={webRelayUrl}>
						{webRelayUrl}
					</BodyM>
				</View>

				<Caption13Up color="secondary" style={styles.label}>
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

				<View style={styles.buttons}>
					<Button
						style={styles.button}
						text={t('es.button_reset')}
						variant="secondary"
						size="large"
						testID="ResetToDefault"
						onPress={resetToDefault}
					/>
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
		marginTop: 12,
		marginBottom: 16,
	},
	buttons: {
		flexDirection: 'row',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(WebRelay);
