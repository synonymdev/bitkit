import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { BITREFILL_REF, appName } from '../../constants/app';
import type { RootStackScreenProps } from '../../navigation/types';
import { View as ThemedView } from '../../styles/components';
import { processUri } from '../../utils/scanner/scanner';

const ShopMain = ({
	route,
}: RootStackScreenProps<'ShopMain'>): ReactElement => {
	const { page } = route.params;
	const { t } = useTranslation('other');

	const baseUrl = 'https://embed.bitrefill.com';
	// Payment method "bitcoin" gives a unified invoice
	const paymentMethod = 'bitcoin';
	const params = `?ref=${BITREFILL_REF}&paymentMethod=${paymentMethod}&theme=dark&utm_source=${appName}`;
	const uri = `${baseUrl}/${page}/${params}`;

	const handleMessage = (event: WebViewMessageEvent) => {
		const json = event.nativeEvent.data;
		const data = JSON.parse(json);

		if (data.event === 'payment_intent') {
			processUri({ uri: data.paymentUri });
		}
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('shop.main.nav_title')} />

			<View style={styles.content}>
				<WebView
					style={styles.webview}
					source={{ uri }}
					onMessage={handleMessage}
				/>
			</View>
		</ThemedView>
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
	webview: {
		backgroundColor: '#141716',
		borderRadius: 8,
		flex: 1,
		marginBottom: 16,
	},
});

export default memo(ShopMain);
