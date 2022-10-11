import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import NavigationHeader from '../../../components/NavigationHeader';
import GradientView from '../../../components/GradientView';
import ContactsList from '../../../components/ContactsList';
import { processInputData } from '../../../utils/scanner';
import Store from '../../../store/types';
import { useSlashtags } from '../../../components/SlashtagsProvider';

const Contacts = ({ navigation }): ReactElement => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const { sdk } = useSlashtags();

	const handlePress = async (contact): Promise<void> => {
		const res = await processInputData({
			data: contact.url,
			source: 'sendScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		});
		if (res.isOk()) {
			navigation.pop();
		}
	};

	return (
		<GradientView style={styles.container}>
			<NavigationHeader title="Send to Contact" size="sm" />
			<View style={styles.content}>
				<ContactsList
					onPress={handlePress}
					sectionBackgroundColor="transparent"
					stickySectionHeadersEnabled={false}
					bottomSheet={true}
				/>
			</View>
		</GradientView>
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

export default memo(Contacts);
