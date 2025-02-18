import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { ScrollView, View } from '../../styles/components';
import WidgetListItem from './WidgetListItem';

const WidgetsSuggestions = (): ReactElement => {
	const { t } = useTranslation('widgets');

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('add')} />
			<View style={styles.content}>
				<ScrollView>
					<WidgetListItem id="price" />
					<WidgetListItem id="news" />
					<WidgetListItem id="blocks" />
					<WidgetListItem id="facts" />
					<WidgetListItem id="calculator" />
					<WidgetListItem id="weather" />
				</ScrollView>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
});

export default WidgetsSuggestions;
