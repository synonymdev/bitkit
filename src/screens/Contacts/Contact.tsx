import React, { useCallback } from 'react';
import { StyleSheet, Share, Alert } from 'react-native';

import {
	CoinsIcon,
	PencileIcon,
	ShareIcon,
	TrashIcon,
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import { TouchableOpacity } from 'react-native';
import ProfileLinks from '../../components/ProfileLinks';
import { deleteContact, getSlashPayConfig } from '../../utils/slashtags';
import { toggleView } from '../../store/actions/user';
import { updateBitcoinTransaction } from '../../store/actions/wallet';
import { sleep } from '../../utils/helpers';
import { EAddressTypeNames } from '../../store/types/wallet';
import { validateAddress } from '../../utils/scanner';
import { useTransactionDetails } from '../../hooks/transaction';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import {
	useSlashtags,
	useSlashtagsSDK,
} from '../../components/SlashtagsProvider';

export const Contact = ({ navigation, route }): JSX.Element => {
	const url = route.params?.url;

	const { profile } = useProfile(url);
	const { slashtag } = useSelectedSlashtag();
	const sdk = useSlashtagsSDK();
	const contactRecord = useSlashtags().contacts[url];

	const onDelete = useCallback(() => {
		deleteContact(slashtag, url);
		navigation.navigate('Tabs');
	}, [navigation, slashtag, url]);

	const transaction = useTransactionDetails();

	return (
		<View style={styles.container}>
			<SafeAreaInsets type={'top'} />
			<NavigationHeader
				title="Contact"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<ProfileCard
					url={url}
					profile={{
						...profile,
						...contactRecord,
					}}
					editable={false}
					resolving={false}
				/>
				<View style={styles.divider} />
				<View style={styles.bottom}>
					<View style={styles.bottomHeader}>
						<IconButton
							onPress={async (): Promise<void> => {
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

								navigation.popToTop();
								toggleView({
									view: 'sendNavigation',
									data: {
										isOpen: true,
										snapPoint: 0,
									},
								});
								await sleep(5); //This is only needed to prevent the view from briefly displaying the SendAssetList
								await updateBitcoinTransaction({
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
							}}>
							<CoinsIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton
							onPress={(): void => {
								Share.share({
									title: 'Share Slashtag url',
									message: url,
								});
							}}>
							<ShareIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton
							onPress={(): void => {
								navigation.navigate('ContactEdit', { url });
							}}>
							<PencileIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton onPress={onDelete}>
							<TrashIcon height={24} width={24} color="brand" />
						</IconButton>
					</View>
					<ProfileLinks links={profile?.links} style={styles.profileDetails} />
				</View>
			</View>
		</View>
	);
};

const IconButton = ({
	children,
	onPress,
}: {
	children?: any;
	onPress?: () => void;
}): JSX.Element => {
	return (
		<TouchableOpacity
			activeOpacity={0.7}
			onPress={onPress}
			style={styles.iconContainer}>
			{children}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		margin: 20,
		marginTop: 0,
		backgroundColor: 'transparent',
	},
	divider: {
		height: 2,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',

		marginTop: 16,
		marginBottom: 16,
	},
	bottom: {
		flex: 1,
		flexDirection: 'column',
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 9999,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	bottomHeader: {
		flexDirection: 'row',
	},
	profileDetails: {
		marginTop: 32,
	},
});

export default Contact;
