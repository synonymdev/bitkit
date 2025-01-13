import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import ContactsList from '../../components/ContactsList';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { useAppDispatch } from '../../hooks/redux';
import { RootStackScreenProps } from '../../navigation/types';
import { addMetaTxSlashtagsUrl } from '../../store/slices/metadata';
import { View as ThemedView } from '../../styles/components';

const ActivityAssignContact = ({
	navigation,
	route,
}: RootStackScreenProps<'ActivityAssignContact'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('contact_assign')} />
			<View style={styles.content}>
				<ContactsList
					onPress={({ url }): void => {
						dispatch(addMetaTxSlashtagsUrl({ txId: route.params.txid, url }));
						navigation.pop();
					}}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		marginTop: 16,
	},
});

export default memo(ActivityAssignContact);
