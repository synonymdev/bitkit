import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import { useTranslation } from 'react-i18next';

import { AnimatedView, View } from '../../styles/components';
import {
	CoinsIcon,
	CopyIcon,
	PencileIcon,
	ShareIcon,
	TrashIcon,
} from '../../styles/icons';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import { deleteContact } from '../../utils/slashtags';
import { processInputData } from '../../utils/scanner';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import {
	useSlashtags,
	useSlashtagsSDK,
} from '../../components/SlashtagsProvider';
import { useBalance } from '../../hooks/wallet';
import { truncate } from '../../utils/helpers';
import { RootStackScreenProps } from '../../navigation/types';
import Dialog from '../../components/Dialog';
import Tooltip from '../../components/Tooltip';
import IconButton from '../../components/IconButton';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { showErrorNotification } from '../../utils/notifications';

const Contact = ({
	navigation,
	route,
}: RootStackScreenProps<'Contact'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { url } = route.params;
	const [showDialog, setShowDialog] = useState(false);
	const [showCopy, setShowCopy] = useState(false);
	const [isSharing, setIsSharing] = useState(false);
	const [loading, setLoading] = useState(false);

	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const { profile } = useProfile(url, { resolve: true });
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
		setLoading(true);
		const res = await processInputData({
			data: url,
			source: 'sendScanner',
			sdk,
			selectedNetwork,
			selectedWallet,
		});
		setLoading(false);
		if (res.isOk()) {
			navigation.popToTop();
			return;
		}
		showErrorNotification({
			title: t('contact_pay_error'),
			message: res.error.message,
		});
	};

	const handleShare = useCallback(async (): Promise<void> => {
		setIsSharing(true);
		try {
			await Share.open({
				title: t('contact_share'),
				message: url,
			});
		} catch (e) {
			console.log(e);
		} finally {
			setIsSharing(false);
		}
	}, [url, t]);

	const profileLinks = profile?.links ?? [];
	const profileLinksWithIds = profileLinks.map((link) => ({
		...link,
		id: `${link.title}:${link.url}`,
	}));

	const name = profile?.name ?? t('contact_this');
	const firstName = name.split(/\s+/)[0];

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('contact')}
				navigateBack={false}
				onBackPress={(): void => {
					navigation.navigate('Contacts');
				}}
				onClosePress={navigation.popToTop}
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
						<IconButton
							style={styles.iconButton}
							disabled={!canSend}
							onPress={handleSend}>
							{loading ? (
								<ActivityIndicator />
							) : (
								<CoinsIcon height={22} width={22} color="brand" />
							)}
						</IconButton>
						<IconButton
							style={styles.iconButton}
							onPress={(): void => {
								onCopy();
							}}>
							<CopyIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton
							style={styles.iconButton}
							disabled={isSharing}
							onPress={handleShare}>
							<ShareIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton
							style={styles.iconButton}
							onPress={(): void => {
								navigation.navigate('ContactEdit', { url });
							}}>
							<PencileIcon height={20} width={20} color="brand" />
						</IconButton>
						<IconButton
							style={styles.iconButton}
							onPress={(): void => {
								setShowDialog(true);
							}}
							testID="DeleteContactButton">
							<TrashIcon height={24} width={24} color="brand" />
						</IconButton>
					</View>
					<ProfileLinks style={styles.links} links={profileLinksWithIds} />

					{showCopy && (
						<AnimatedView
							entering={FadeIn.duration(500)}
							exiting={FadeOut.duration(500)}
							color="transparent"
							style={styles.tooltip}>
							<Tooltip text={t('contact_copied')} />
						</AnimatedView>
					)}
				</View>
			</View>

			<Dialog
				visible={showDialog}
				title={t('contact_delete_title', { name: truncate(firstName, 30) })}
				description={t('contact_delete_text', {
					name: truncate(firstName, 30),
				})}
				confirmText={t('contact_delete_yes')}
				onCancel={(): void => setShowDialog(false)}
				onConfirm={(): void => {
					onDelete();
					setShowDialog(false);
				}}
			/>
		</View>
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
	iconButton: {
		marginRight: 16,
	},
	bottomHeader: {
		flexDirection: 'row',
	},
	links: {
		marginTop: 32,
	},
	tooltip: {
		position: 'absolute',
		alignSelf: 'center',
		top: '68%',
	},
});

export default Contact;
