import Clipboard from '@react-native-clipboard/clipboard';
import { parse } from '@synonymdev/slashtags-url';
import React, { ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import Share from 'react-native-share';

import Dialog from '../../components/Dialog';
import NavigationHeader from '../../components/NavigationHeader';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import SafeAreaInset from '../../components/SafeAreaInset';
import Tooltip from '../../components/Tooltip';
import IconButton from '../../components/buttons/IconButton';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useProfile } from '../../hooks/slashtags';
import { useBalance } from '../../hooks/wallet';
import { RootStackScreenProps } from '../../navigation/types';
import { contactsSelector } from '../../store/reselect/slashtags';
import { isLDKReadySelector } from '../../store/reselect/ui';
import { selectedNetworkSelector } from '../../store/reselect/wallet';
import { deleteContact } from '../../store/slices/slashtags';
import { AnimatedView, View } from '../../styles/components';
import {
	CoinsIcon,
	CopyIcon,
	PencilIcon,
	ShareIcon,
	TrashIcon,
} from '../../styles/icons';
import { truncate } from '../../utils/helpers';
import { showToast } from '../../utils/notifications';
import { processUri } from '../../utils/scanner/scanner';

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

	const dispatch = useAppDispatch();
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const contacts = useAppSelector(contactsSelector);
	const isLDKReady = useAppSelector(isLDKReadySelector);

	const { profile } = useProfile(url);
	const savedContact = useMemo(() => {
		const { id } = parse(url);
		return contacts[id];
	}, [contacts, url]);
	const { spendableBalance } = useBalance();

	const canSend = useMemo(() => {
		return spendableBalance > 0;
	}, [spendableBalance]);

	const profileCard = useMemo(
		() => ({ ...profile, name: savedContact?.name ?? profile?.name }),
		[profile, savedContact],
	);

	const onCopy = (): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	};

	const onDelete = useCallback(() => {
		dispatch(deleteContact(url));
		navigation.navigate('Contacts');
	}, [navigation, url, dispatch]);

	const handleSend = async (): Promise<void> => {
		if (loading) {
			return;
		}
		setLoading(true);

		// if LDK is not ready yet, show a toast warning that it might take a few seconds
		if (!isLDKReady) {
			showToast({
				type: 'info',
				title: t('contact_ldk_not_ready'),
				description: t('lightning:wait_text_top'),
			});
		}

		const res = await processUri({
			uri: url,
			source: 'send',
			selectedNetwork,
		});
		setLoading(false);
		if (res.isOk()) {
			navigation.popToTop();
		} else {
			console.log(res.error.message);
			showToast({
				type: 'warning',
				title: t('contact_pay_error'),
				description: res.error.message,
			});
		}
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
		<View style={styles.root}>
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
				<View style={styles.divider} color="white10" />
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
							<PencilIcon height={20} width={20} color="brand" />
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
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingTop: 4,
		paddingHorizontal: 16,
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
