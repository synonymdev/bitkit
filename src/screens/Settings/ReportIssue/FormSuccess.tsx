import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import type { SettingsScreenProps } from '../../../navigation/types';
import { View as ThemedView } from '../../../styles/components';
import { BodyM } from '../../../styles/text';

const imageSrc = require('../../../assets/illustrations/email.png');

const FormSuccess = ({
	navigation,
}: SettingsScreenProps<'FormSuccess'>): ReactElement => {
	const { t } = useTranslation('settings');

	const onOk = (): void => {
		navigation.navigate('SupportSettings');
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('support.title_success')} />
			<View style={styles.content}>
				<BodyM style={styles.text} color="secondary">
					{t('support.text_success')}
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('support.text_success_button')}
						size="large"
						testID="SuccessButton"
						onPress={onOk}
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
		flexGrow: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		paddingBottom: 32,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
});

export default memo(FormSuccess);
