import React, { memo, ReactElement } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import { View as ThemedView } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import ContactsList from '../../../components/ContactsList';
import { validateAddress } from '../../../utils/scanner';
import { EAddressTypeNames } from '../../../store/types/wallet';
import { updateBitcoinTransaction } from '../../../store/actions/wallet';
import Store from '../../../store/types';
import { useTransactionDetails } from '../../../hooks/transaction';
import { getSlashPayConfig } from '../../../utils/slashtags';
import { useSlashtags } from '../../../components/SlashtagsProvider';

const Contacts = ({ navigation }): ReactElement => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const transaction = useTransactionDetails();

	const { sdk } = useSlashtags();

	const handlePress = async (contact): Promise<void> => {
		const url = contact.url;
		const payConfig = await getSlashPayConfig(sdk, url);

		const onChainAddresses = payConfig
			.filter((e) => {
				return Object.keys(EAddressTypeNames).includes(e.type);
			})
			.map((config) => config.value);

		const address = onChainAddresses.find(
			(a) => validateAddress({ address: a }).isValid,
		);

		if (!address) {
			Alert.alert('Error', 'No valid address found.');
			return;
		}

		await updateBitcoinTransaction({
			selectedWallet,
			selectedNetwork,
			transaction: {
				outputs: [
					{
						address,
						value: transaction.outputs?.[0]?.value ?? 0,
						index: 0,
					},
				],
				slashTagsUrl: url,
			},
		});

		navigation.pop();
	};

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<NavigationHeader title="Send to Contact" size="sm" />
			<View style={styles.content}>
				<ContactsList
					onPress={handlePress}
					sectionBackgroundColor="onSurface"
				/>
			</View>
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

export default memo(Contacts);
