import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { updateUi } from '../store/actions/ui';
import { View, AnimatedView } from '../styles/components';
import { Text01M, Caption13M } from '../styles/text';
import { BrokenLinkIcon } from '../styles/icons';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../utils/notifications';
import { connectToElectrum } from '../utils/wallet/electrum';
import Button from './Button';
import {
	isConnectedToElectrumSelector,
	isOnlineSelector,
} from '../store/reselect/ui';

const ConnectivityIndicator = (): ReactElement => {
	const { t } = useTranslation('other');
	const [isLoading, setIsLoading] = useState(false);

	const isConnectedToElectrum = useSelector(isConnectedToElectrumSelector);
	const isOnline = useSelector(isOnlineSelector);

	if (isOnline && isConnectedToElectrum) {
		return <></>;
	}

	const onRetry = async (): Promise<void> => {
		setIsLoading(true);
		const connectionResponse = await connectToElectrum();
		if (connectionResponse.isOk()) {
			updateUi({ isConnectedToElectrum: true });
			showSuccessNotification({
				title: t('connection_restored_title'),
				message: t('connection_restored_message'),
			});
		} else {
			showErrorNotification({
				title: t('connection_lost_title'),
				message: t('connection_lost_message'),
			});
		}
		setIsLoading(false);
	};

	return (
		<AnimatedView
			style={styles.container}
			color="transparent"
			entering={FadeIn}
			exiting={FadeOut}>
			<BrokenLinkIcon />
			<View color="transparent" style={styles.textContainer}>
				<Text01M>{t('connection_issue')}</Text01M>
				<Caption13M color="gray1">{t('connection_issue_explain')}</Caption13M>
			</View>

			{isOnline && !isConnectedToElectrum && (
				<Button
					style={styles.button}
					text={t('retry')}
					loading={isLoading}
					onPress={onRetry}
				/>
			)}
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		minHeight: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginTop: 20,
	},
	textContainer: {
		marginHorizontal: 12,
	},
	button: {
		paddingHorizontal: 0,
		minWidth: 80,
		marginLeft: 'auto',
	},
});

export default memo(ConnectivityIndicator);
