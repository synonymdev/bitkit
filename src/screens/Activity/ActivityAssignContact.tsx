import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { View as ThemedView } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import ContactsList from '../../components/ContactsList';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { addMetaSlashTagsUrlTag } from '../../store/actions/metadata';

const ActivityAssignContact = ({ navigation, route }): ReactElement => {
	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Assign Contact" size="sm" />
			<View style={styles.content}>
				<ContactsList
					onPress={({ url }): void => {
						addMetaSlashTagsUrlTag(route.params.txid, url);
						navigation.pop();
					}}
				/>
			</View>
			<SafeAreaInsets type="bottom" />
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
