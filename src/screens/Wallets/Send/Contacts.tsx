import React, { memo, ReactElement, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import ContactsList from '../../../components/ContactsList';
import { useAppSelector } from '../../../hooks/redux';
import { processUri } from '../../../utils/scanner/scanner';
import { showToast } from '../../../utils/notifications';
import type { SendScreenProps } from '../../../navigation/types';
import type { IContactRecord } from '../../../store/types/slashtags';
import { selectedNetworkSelector } from '../../../store/reselect/wallet';
import {
	resetSendTransaction,
	setupOnChainTransaction,
} from '../../../store/actions/wallet';

const Contacts = ({
	navigation,
}: SendScreenProps<'Contacts'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const [loading, setLoading] = useState(false);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);

	const handlePress = async (contact: IContactRecord): Promise<void> => {
		// make sure we start with a clean transaction state
		await resetSendTransaction();
		await setupOnChainTransaction({});
		setLoading(true);
		const res = await processUri({
			uri: contact.url,
			source: 'send',
			selectedNetwork,
		});
		setLoading(false);
		if (res.isOk()) {
			navigation.navigate('Amount');
		} else {
			showToast({
				type: 'warning',
				title: t('contact_pay_error'),
				description: res.error.message,
			});
		}
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('contact_select')} />
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
