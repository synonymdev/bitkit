import React, { ReactElement } from 'react';
import { View, Linking, Platform, StyleSheet } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Text01S, Text01B } from '../styles/text';
import { ExclamationIcon } from '../styles/icons';
import SafeAreaView from './SafeAreaView';
import NavigationHeader from './NavigationHeader';
import BottomSheetNavigationHeader from './BottomSheetNavigationHeader';
import SafeAreaInset from './SafeAreaInset';
import Button from './Button';

const CameraNoAuth = ({
	bottomSheet = false,
}: {
	bottomSheet?: boolean;
}): ReactElement => {
	const { t } = useTranslation('other');

	const goToSettings = (): void => {
		Platform.OS === 'ios'
			? Linking.openURL('App-Prefs:Settings')
			: Linking.sendIntent('android.settings.SETTINGS');
	};

	const Wrapper = bottomSheet ? View : SafeAreaView;
	const Header = bottomSheet ? BottomSheetNavigationHeader : NavigationHeader;

	return (
		<Wrapper style={styles.root}>
			<Header title="Permission" />
			<View style={styles.content}>
				<View style={styles.textContent}>
					<ExclamationIcon />
					<Text01S style={styles.text}>
						<Trans
							t={t}
							i18nKey="camera_no_text"
							components={{ bold: <Text01B /> }}
						/>
					</Text01S>
				</View>
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						text={t('phone_settings')}
						onPress={goToSettings}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</Wrapper>
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
	textContent: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		marginTop: 16,
		textAlign: 'center',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		paddingHorizontal: 16,
		flex: 1,
	},
});

export default CameraNoAuth;
