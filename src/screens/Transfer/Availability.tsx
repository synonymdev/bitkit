import React, { ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, BodyMB, BodyM } from '../../styles/text';
import { View as ThemedView } from '../../styles/components';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/buttons/Button';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const Availability = ({
	navigation,
}: TransferScreenProps<'Availability'>): ReactElement => {
	const { t } = useTranslation('lightning');

	const onCancel = (): void => {
		navigation.navigate('Wallet');
	};

	const onContinue = (): void => {
		navigation.navigate('SavingsConfirm');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('transfer.nav_title')} />
			<View style={styles.content}>
				<Display>
					<Trans
						t={t}
						i18nKey="availability.title"
						components={{ accent: <Display color="brand" /> }}
					/>
				</Display>
				<BodyM style={styles.text} color="secondary">
					<Trans
						t={t}
						i18nKey="availability.text"
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
						text={t('continue')}
						size="large"
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

export default Availability;
