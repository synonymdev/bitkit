import React, {
	memo,
	MutableRefObject,
	ReactElement,
	useCallback,
	useMemo,
	useRef,
	useState,
} from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import {
	View,
	StyleSheet,
	useWindowDimensions,
	ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';

import {
	AnimatedView,
	CopyIcon,
	InfoIcon,
	PencileIcon,
	QrPage,
	ShareIcon,
	Text02S,
	TouchableOpacity,
	UsersIcon,
	View as ThemedView,
} from '../../styles/components';
import Store from '../../store/types';
import { BasicProfile } from '../../store/types/slashtags';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import { truncate } from '../../utils/helpers';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import ProfileLinks from '../../components/ProfileLinks';
import Tooltip from '../../components/Tooltip';
import Divider from '../../components/Divider';
import IconButton from '../../components/IconButton';
import ProfileEdit from './ProfileEdit';
import { ProfileIntro, OfflinePayments } from './ProfileOnboarding';
import type { RootStackScreenProps } from '../../navigation/types';

const Profile = memo((props: RootStackScreenProps<'Profile'>): ReactElement => {
	const onboardingProfileStep = useSelector(
		(state: Store) => state.slashtags.onboardingProfileStep,
	);

	switch (onboardingProfileStep) {
		case 'Intro':
			return <ProfileIntro {...props} />;
		case 'InitialEdit':
			return <ProfileEdit {...props} />;
		case 'OfflinePayments':
			return <OfflinePayments {...props} />;
		case 'Done':
			return <ProfileScreen {...props} />;
		default:
			return <ProfileScreen {...props} />;
	}
});

const ProfileScreen = ({
	navigation,
}: RootStackScreenProps<'Profile'>): ReactElement => {
	const [showCopy, setShowCopy] = useState(false);
	const { url } = useSelectedSlashtag();
	const { profile } = useProfile(url);
	const qrRef = useRef<object>();

	const [view, setView] = useState('qr');
	const [isSharing, setIsSharing] = useState(false);

	const switchView = useCallback((): void => {
		view === 'details' ? setView('qr') : setView('details');
	}, [view]);

	// const onSwipeLeft = (): void => {
	// 	navigation.navigate('Tabs');
	// };

	const handleCopy = useCallback((): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	}, [url]);

	const handleShare = useCallback(async (): Promise<void> => {
		setIsSharing(true);
		const image = `data:image/png;base64,${qrRef.current}`;
		try {
			await Share.open({
				title: 'Share Profile Key',
				message: url,
				url: image,
				type: 'image/png',
			});
		} catch (e) {
			console.log(e);
		} finally {
			setIsSharing(false);
		}
	}, [url]);

	const profileLinks = useMemo(() => profile?.links ?? [], [profile?.links]);
	const profileLinksWithIds = useMemo(
		() =>
			profileLinks.map((link) => ({
				...link,
				id: `${link.title}:${link.url}`,
			})),
		[profileLinks],
	);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				style={styles.header}
				title="Profile"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			{/* Disable swipe detection because it causes ScrollView to be buggy */}
			{/* <DetectSwipe onSwipeLeft={onSwipeLeft}> */}
			<ScrollView>
				<View style={styles.content}>
					<ProfileCard url={url} profile={profile} resolving={false} />
					<Divider />
					<View style={styles.bottom}>
						<View style={styles.bottomHeader}>
							<IconButton style={styles.iconButton} onPress={switchView}>
								{view === 'qr' ? (
									<InfoIcon height={20} width={20} color="brand" />
								) : (
									<QrPage height={20} width={20} color="brand" />
								)}
							</IconButton>
							<IconButton style={styles.iconButton} onPress={handleCopy}>
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
									navigation.navigate('ProfileEdit');
								}}>
								<PencileIcon height={20} width={20} color="brand" />
							</IconButton>
							<IconButton
								style={styles.iconButton}
								onPress={(): void => {
									navigation.navigate('Contacts');
								}}>
								<UsersIcon height={24} width={24} color="brand" />
							</IconButton>
						</View>
						{view === 'details' ? (
							<ProfileLinks
								links={profileLinksWithIds}
								style={styles.profileDetails}
							/>
						) : (
							<QRView url={url} profile={profile} qrRef={qrRef} />
						)}
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
				<SafeAreaInsets type="bottom" />
			</ScrollView>
			{/* </DetectSwipe> */}
		</ThemedView>
	);
};

const QRView = ({
	url,
	profile,
	qrRef,
}: {
	url: string;
	profile?: BasicProfile;
	qrRef: MutableRefObject<any>;
}): ReactElement => {
	const dimensions = useWindowDimensions();
	const [showCopy, setShowCopy] = useState(false);

	const qrMaxHeight = useMemo(
		() => dimensions.height / 2.3,
		[dimensions?.height],
	);
	const qrMaxWidth = useMemo(
		() => dimensions.width - 16 * 2,
		[dimensions?.width],
	);
	const qrSize = useMemo(
		() => Math.min(qrMaxWidth, qrMaxHeight),
		[qrMaxHeight, qrMaxWidth],
	);

	const handleCopy = useCallback((): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	}, [url]);

	const handleCopyQrCode = useCallback((): void => {
		console.log('TODO: copy QR code as image');
		// not implemented in upstream yet
		// https://github.com/react-native-clipboard/clipboard/issues/6
		// qrRef.current.toDataURL((base64) => {
		// 	const image = `data:image/png;base64,${base64}`;
		// 	// Clipboard.setString(image);
		// });
	}, []);

	const name = useMemo(() => profile?.name ?? 'Profile', [profile?.name]);
	const firstName = useMemo(() => name.split(/\s+/)[0], [name]);

	return (
		<View style={styles.qrViewContainer}>
			<View style={styles.qrContainer}>
				<TouchableOpacity
					color="white"
					activeOpacity={1}
					onPress={handleCopy}
					onLongPress={handleCopyQrCode}>
					<QRCode
						value={url}
						size={qrSize}
						logo={{ uri: profile?.image || '' }}
						logoBackgroundColor={profile?.image ? '#fff' : 'transparent'}
						logoSize={50}
						logoBorderRadius={999}
						logoMargin={9}
						quietZone={20}
						getRef={(c): void => {
							if (c) {
								c.toDataURL((data) => (qrRef.current = data));
							}
						}}
					/>
				</TouchableOpacity>

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
			<Text02S style={styles.qrViewNote}>
				Scan to add {truncate(firstName, 30)}
			</Text02S>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingBottom: 16,
	},
	header: {
		paddingBottom: 12,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingTop: 23,
		paddingHorizontal: 16,
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
	qrViewContainer: {
		alignItems: 'center',
		flex: 1,
	},
	qrContainer: {
		borderRadius: 10,
		marginTop: 32,
		overflow: 'hidden',
	},
	qrViewNote: {
		marginTop: 16,
	},
	profileDetails: {
		marginTop: 40,
	},
	tooltip: {
		position: 'absolute',
		alignSelf: 'center',
		top: '68%',
	},
});

export default memo(Profile);
