import React, { ReactElement } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { FadeOut, withRepeat, withTiming } from 'react-native-reanimated';
import { Trans, useTranslation } from 'react-i18next';

import { AnimatedView } from '../../styles/components';
import { Display } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import { __E2E__ } from '../../constants/env';

const imageSrc = require('../../assets/illustrations/rocket.png');

const LoadingWalletScreen = (): ReactElement => {
	const { t } = useTranslation('onboarding');

	const entering = (): { initialValues: {}; animations: {} } => {
		'worklet';
		const initialValues = {
			transform: [{ translateX: -1000 }, { translateY: 1000 }],
		};

		const animations = {
			transform: [
				{
					translateX: withRepeat(withTiming(1000, { duration: 5000 }), -1),
				},
				{
					translateY: withRepeat(withTiming(-1000, { duration: 5000 }), -1),
				},
			],
		};

		return {
			initialValues,
			animations,
		};
	};

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<View style={styles.loadingText}>
				<Display>
					<Trans
						t={t}
						i18nKey="loading_header"
						components={{
							brand: <Display color="brand" />,
						}}
					/>
				</Display>
			</View>
			<View style={styles.animationContainer}>
				<AnimatedView
					entering={__E2E__ ? undefined : entering}
					exiting={__E2E__ ? undefined : FadeOut}
					color="transparent">
					<Image source={imageSrc} />
				</AnimatedView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 32,
	},
	loadingText: {
		flex: 1,
		justifyContent: 'center',
	},
	animationContainer: {
		marginTop: 30,
		flex: 2,
		alignItems: 'center',
		alignSelf: 'center',
	},
});

export default LoadingWalletScreen;
