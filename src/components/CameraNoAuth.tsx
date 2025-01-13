import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { ExclamationIcon } from '../styles/icons';
import { BodyM, BodyMB } from '../styles/text';
import BottomSheetNavigationHeader from './BottomSheetNavigationHeader';
import NavigationHeader from './NavigationHeader';
import SafeAreaInset from './SafeAreaInset';
import SafeAreaView from './SafeAreaView';
import Button from './buttons/Button';

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
					<BodyM style={styles.text}>
						<Trans
							t={t}
							i18nKey="camera_no_text"
							components={{ bold: <BodyMB /> }}
						/>
					</BodyM>
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
