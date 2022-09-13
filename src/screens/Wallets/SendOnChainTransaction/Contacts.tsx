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

const Contacts = ({ navigation }): ReactElement => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const transaction = useTransactionDetails();

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<NavigationHeader title="Send to Contact" size="sm" />
			<View style={styles.content}>
				<ContactsList
					onPress={async (contact): Promise<void> => {
						const nContact = {
							...contact,
							slashpay: {
								p2wpkh: 'bcrt1qqrgq9cfg6xagfel9gc0txfte9725l6qnpv3vm3',
							},
						};

						const address = Object.keys(EAddressTypeNames)
							.map((type) => nContact?.slashpay?.[type])
							.find((a) => validateAddress({ address: a }).isValid);

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
								slashTagsUrl: nContact.url,
							},
						});

						navigation.pop();
					}}
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
