import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import { StyleSheet, Share } from 'react-native';
import { useSelector } from 'react-redux';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';

import {
	AnimatedView,
	CoinsIcon,
	CopyIcon,
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
import { useBalance } from '../../hooks/wallet';
import { RootStackScreenProps } from '../../navigation/types';
import Dialog from '../../components/Dialog';
import Tooltip from '../../components/Tooltip';
import { truncate } from '../../utils/helpers';

export const Contact = ({
	navigation,
	route,
}: RootStackScreenProps<'Contact'>): JSX.Element => {
	const [showDialog, setShowDialog] = useState(false);
	const [showCopy, setShowCopy] = useState(false);

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
	const balance = useBalance({ onchain: true, lightning: true });

	const canSend = useMemo(() => {
		return balance.satoshis > 0;
	}, [balance.satoshis]);

	const profileCard = useMemo(
		() => ({ ...profile, ...contactRecord }),
		[profile, contactRecord],
	);

	const onCopy = (): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	};

	const onDelete = useCallback(() => {
		deleteContact(slashtag, url);
		navigation.navigate('Contacts');
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

	const profileLinks = profile?.links ?? [];
	const profileLinksWithIds = profileLinks.map((link) => ({
		...link,
		id: `${link.title}:${link.url}`,
	}));

	const name = profile?.name ?? '';
	const firstName = name.split(/\s+/)[0];

	return (
		<View style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Contact"
				navigateBack={false}
				onBackPress={(): void => {
					navigation.navigate('Contacts');
				}}
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
						<IconButton disabled={!canSend} onPress={handleSend}>
							<CoinsIcon height={22} width={22} color="brand" />
						</IconButton>
						<IconButton
							onPress={(): void => {
								url && onCopy();
							}}>
							<CopyIcon height={24} width={24} color="brand" />
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
							<PencileIcon height={20} width={20} color="brand" />
						</IconButton>
						<IconButton
							onPress={(): void => {
								setShowDialog(true);
							}}>
							<TrashIcon height={24} width={24} color="brand" />
						</IconButton>
					</View>
					<ProfileLinks
						links={profileLinksWithIds}
						style={styles.profileDetails}
					/>

					{showCopy && (
						<AnimatedView
							entering={FadeIn.duration(500)}
							exiting={FadeOut.duration(500)}
							color="transparent"
							style={styles.tooltip}>
							<Tooltip text="Profile Key Copied To Clipboard" />
						</AnimatedView>
					)}
				</View>
			</View>

			<Dialog
				visible={showDialog}
				title={`Delete ${truncate(firstName, 30)}?`}
				description={`Are you sure you want to delete ${truncate(
					firstName,
					30,
				)} from your contacts?`}
				confirmText="Yes, Delete"
				onCancel={(): void => setShowDialog(false)}
				onConfirm={(): void => {
					onDelete();
					setShowDialog(false);
				}}
			/>
		</View>
	);
};

const IconButton = ({
	children,
	disabled = false,
	onPress,
}: {
	children?: ReactNode;
	disabled?: boolean;
	onPress?: () => void;
}): JSX.Element => {
	const buttonStyles = useMemo(
		() => ({
			...styles.iconContainer,
			opacity: disabled ? 0.6 : 1,
		}),
		[disabled],
	);

	return (
		<TouchableOpacity
			style={buttonStyles}
			activeOpacity={0.7}
			color="white08"
			disabled={disabled}
			onPress={onPress}>
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
		height: 1,
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
	tooltip: {
		position: 'absolute',
		alignSelf: 'center',
		top: '68%',
	},
});

export default Contact;
