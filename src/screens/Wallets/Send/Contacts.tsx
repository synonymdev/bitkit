import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import NavigationHeader from '../../../components/NavigationHeader';
import GradientView from '../../../components/GradientView';
import ContactsList from '../../../components/ContactsList';
import { processInputData } from '../../../utils/scanner';
import { showErrorNotification } from '../../../utils/notifications';
import { useSlashtags } from '../../../components/SlashtagsProvider';
import type { SendScreenProps } from '../../../navigation/types';
import type { IContactRecord } from '../../../store/types/slashtags';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';

const Contacts = ({
	navigation,
}: SendScreenProps<'Contacts'>): ReactElement => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const { sdk } = useSlashtags();

	const handlePress = async (contact: IContactRecord): Promise<void> => {
		const res = await processInputData({
			data: contact.url,
			source: 'sendScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		});
		if (res.isOk()) {
			navigation.pop();
			return;
		}
		showErrorNotification({
			title: 'Unable To Pay to this contact',
			message: res.error.message,
		});
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
