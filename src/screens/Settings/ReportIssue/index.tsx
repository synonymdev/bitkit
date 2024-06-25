import React, { memo, ReactElement, useState } from 'react';
import axios from 'axios';
import RNFS from 'react-native-fs';
import { View, StyleSheet, Platform } from 'react-native';
import {
	getBuildNumber,
	getSystemVersion,
	getVersion,
} from 'react-native-device-info';
import { useTranslation } from 'react-i18next';

import { getNodeId, getNodeVersion } from '../../../utils/lightning';
import { zipLogs } from '../../../utils/lightning/logs';
import { BodyM } from '../../../styles/text';
import { ScrollView, View as ThemedView } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import type { SettingsScreenProps } from '../../../navigation/types';
import LabeledInput from '../../../components/LabeledInput';
import Button from '../../../components/Button';
import { __CHATWOOT_API__ } from '../../../constants/env';
import KeyboardAvoidingView from '../../../components/KeyboardAvoidingView';

const ReportIssue = ({
	navigation,
}: SettingsScreenProps<'ReportIssue'>): ReactElement => {
	const { t } = useTranslation('settings');
	const [email, setEmail] = useState('');
	const [message, setMessage] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const validateEmail = (emailText: string): boolean => {
		if (emailText.indexOf('@') !== -1) {
			const [beforeAt, afterAt] = emailText.split('@');
			if (beforeAt.length > 0 && afterAt.length > 0) {
				return true;
			}
		}
		return false;
	};

	const sendRequest = async (): Promise<void> => {
		try {
			setIsLoading(true);
			let ldkVersion = '';
			let ldkNodeId = '';
			let logs = '';
			let logsFileName = '';
			const ldkVersionUser = await getNodeVersion();
			const ldknodeIdUser = await getNodeId();
			const logsUser = await zipLogs();

			if (ldkVersionUser.isOk() && ldknodeIdUser.isOk() && logsUser.isOk()) {
				ldkVersion += `ldk-${ldkVersionUser.value.ldk} c_bindings-${ldkVersionUser.value.c_bindings}`;
				ldkNodeId += `${ldknodeIdUser.value}`;
				const logsContent = await RNFS.readFile(logsUser.value, 'base64');
				const logsName = logsUser.value.match(/\/([^/]+)\.zip$/);
				logs += `${logsContent}`;
				if (logsName && logsName.length > 1) {
					logsFileName += `${logsName[1]}`;
				}
			}
			await axios.post(`${__CHATWOOT_API__}`, {
				email,
				message,
				platform: `${Platform.OS} ${getSystemVersion()}`,
				version: `${getVersion()} (${getBuildNumber()})`,
				ldkVersion: ldkVersion,
				ldkNodeId: ldkNodeId,
				logs: logs,
				logsFileName: logsFileName,
			});
			navigation.navigate('FormSuccess');
			setEmail('');
			setMessage('');
			setIsLoading(false);
		} catch (error) {
			console.error('Error', error);
			navigation.navigate('FormError');
			setEmail('');
			setMessage('');
			setIsLoading(false);
		}
	};

	const isValid = validateEmail(email) && message;

	return (
		<ThemedView style={styles.root}>
			<KeyboardAvoidingView style={styles.content}>
				<ScrollView
					color="transparent"
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					bounces={false}>
					<SafeAreaInset type="top" />
					<NavigationHeader
						title={t('support.report')}
						onClosePress={(): void => {
							navigation.navigate('Wallet');
						}}
					/>
					<View style={styles.form}>
						<BodyM style={styles.text} color="secondary">
							{t('support.report_text')}
						</BodyM>

						<LabeledInput
							style={styles.addressInput}
							label={t('support.label_address')}
							placeholder={t('support.placeholder_address')}
							maxLength={50}
							value={email}
							testID="emailValueInput"
							onChange={(value: string): void => {
								setEmail(value);
							}}
						/>
						<LabeledInput
							placeholder={t('support.placeholder_message')}
							multiline={true}
							value={message}
							returnKeyType="default"
							label={t('support.label_message')}
							maxLength={5048}
							testID="messageValueInput"
							lines={5.5}
							onChange={(value: string): void => {
								setMessage(value);
							}}
						/>

						<View style={styles.buttonContainer}>
							<Button
								style={styles.button}
								text={t('support.text_button')}
								size="large"
								disabled={!isValid}
								loading={isLoading}
								testID="SendRequest"
								onPress={sendRequest}
							/>
						</View>
					</View>
					<SafeAreaInset type="bottom" minPadding={16} />
				</ScrollView>
			</KeyboardAvoidingView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'stretch',
	},
	scrollContent: {
		flexGrow: 1,
	},
	form: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		paddingBottom: 32,
	},
	addressInput: {
		marginBottom: 26,
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
		marginTop: 32,
	},
});

export default memo(ReportIssue);
