import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Share } from 'react-native';
import { useSelector } from 'react-redux';

import {
	CoinsIcon,
	PencileIcon,
	ShareIcon,
	TouchableOpacity,
	TrashIcon,
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import { deleteContact } from '../../utils/slashtags';
import { processInputData } from '../../utils/scanner';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import {
	useSlashtags,
	useSlashtagsSDK,
} from '../../components/SlashtagsProvider';
import Store from '../../store/types';

export const Contact = ({ navigation, route }): JSX.Element => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const url = route.params?.url;

	const { profile } = useProfile(url);
	const { slashtag } = useSelectedSlashtag();
	const sdk = useSlashtagsSDK();
	const contactRecord = useSlashtags().contacts[url];
	const profileCard = useMemo(
		() => ({ ...profile, ...contactRecord }),
		[profile, contactRecord],
	);

	const onDelete = useCallback(() => {
		deleteContact(slashtag, url);
		navigation.navigate('Tabs');
	}, [navigation, slashtag, url]);

	const handleSend = async (): Promise<void> => {
		const res = await processInputData({
			data: url,
			source: 'sendScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		});
		if (res.isOk()) {
			navigation.popToTop();
		}
	};

	return (
		<View style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Contact"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<ProfileCard
					url={url}
					profile={profileCard}
					editable={false}
					resolving={false}
				/>
				<View style={styles.divider} color="white1" />
				<View style={styles.bottom}>
					<View style={styles.bottomHeader}>
						<IconButton onPress={handleSend}>
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
			color="white08"
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
