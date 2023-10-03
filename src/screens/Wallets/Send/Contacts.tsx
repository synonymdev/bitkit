import React, { memo, ReactElement, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import NavigationHeader from '../../../components/NavigationHeader';
import GradientView from '../../../components/GradientView';
import ContactsList from '../../../components/ContactsList';
import { processInputData } from '../../../utils/scanner';
import { showToast } from '../../../utils/notifications';
import { useSlashtags } from '../../../components/SlashtagsProvider';
import type { SendScreenProps } from '../../../navigation/types';
import type { IContactRecord } from '../../../store/types/slashtags';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../../store/reselect/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';

const Contacts = ({
	navigation,
}: SendScreenProps<'Contacts'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const [loading, setLoading] = useState(false);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const { sdk } = useSlashtags();

	const handlePress = async (contact: IContactRecord): Promise<void> => {
		// make sure we start with a clean transaction state
		resetSendTransaction({
			selectedWallet,
			selectedNetwork,
		});
		await setupOnChainTransaction({
			selectedNetwork,
			selectedWallet,
		});
		setLoading(true);
		const res = await processInputData({
			data: contact.url,
			source: 'send',
			sdk,
			selectedNetwork,
			selectedWallet,
		});
		setLoading(false);
		if (res.isOk()) {
			navigation.navigate('Amount');
		} else {
			console.log(res.error.message);
			showToast({
				type: 'error',
				title: t('contact_pay_error'),
				description: `An error occurred: ${res.error.message}`,
			});
		}
	};

	return (
		<GradientView style={styles.container}>
			<NavigationHeader title={t('contact_select')} size="sm" />
			<View style={styles.content}>
				{loading ? (
					<View style={styles.loading}>
						<ActivityIndicator />
					</View>
				) : (
					<ContactsList
						onPress={handlePress}
						sectionBackgroundColor="transparent"
						stickySectionHeadersEnabled={false}
						bottomSheet={true}
					/>
				)}
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
	loading: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
});

export default memo(Contacts);
