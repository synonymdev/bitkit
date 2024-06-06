import React, { ReactElement, memo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, BodyMB, BodyM } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { useAppDispatch } from '../../hooks/redux';
import { refreshWallet } from '../../utils/wallet';
import { closeAllChannels } from '../../utils/lightning';
import { startCoopCloseTimer } from '../../store/slices/user';
import type { LightningScreenProps } from '../../navigation/types';
import { sleep } from '../../utils/helpers';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const Availability = ({
	navigation,
}: LightningScreenProps<'Availability'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const [isLoading, setIsLoading] = useState(false);
	const dispatch = useAppDispatch();

	const onCancel = (): void => {
		navigation.goBack();
	};

	const onContinue = async (): Promise<void> => {
		setIsLoading(true);
		const closeResponse = await closeAllChannels();

		if (closeResponse.isOk() && closeResponse.value.length === 0) {
			await refreshWallet();
			await sleep(5000); // give beignet some time to process
			navigation.navigate('Success', { type: 'savings' });
			return;
		} else {
			dispatch(startCoopCloseTimer());
			navigation.navigate('Interrupted');
		}
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('availability_title')}
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<Display>
					<Trans
						t={t}
						i18nKey="availability_header"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>
				<BodyM color="secondary" style={styles.text}>
					<Trans
						t={t}
						i18nKey="availability_text"
						components={{ accent: <BodyMB color="white" /> }}
					/>
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('cancel')}
						size="large"
						variant="secondary"
						onPress={onCancel}
					/>
					<Button
						style={styles.button}
						text={t('ok')}
						size="large"
						loading={isLoading}
						onPress={onContinue}
					/>
				</View>
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
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 16,
	},
	imageContainer: {
		alignItems: 'center',
		alignSelf: 'center',
		aspectRatio: 1,
		width: 256,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(Availability);
