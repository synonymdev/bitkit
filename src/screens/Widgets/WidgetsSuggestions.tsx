import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import type { RootStackScreenProps } from '../../navigation/types';
import { ScrollView, View } from '../../styles/components';
import FeedWidgetItems from './FeedWidgetItems';
import WidgetListItem from './WidgetListItem';

const WidgetsSuggestions = ({
	navigation,
}: RootStackScreenProps<'WidgetsSuggestions'>): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('widget_add')} />
			<View style={styles.content}>
				<ScrollView>
					<FeedWidgetItems />
					<WidgetListItem id="calculator" />
				</ScrollView>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('widget_qr')}
						size="large"
						onPress={(): void => navigation.navigate('Scanner')}
					/>
				</View>
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
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default WidgetsSuggestions;
