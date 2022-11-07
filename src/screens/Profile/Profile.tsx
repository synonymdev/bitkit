import React, { ReactElement, useMemo, useState } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import {
	View,
	StyleSheet,
	useWindowDimensions,
	Share,
	ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import QR from 'react-native-qrcode-svg';

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
// import DetectSwipe from '../../components/DetectSwipe';
import Divider from '../../components/Divider';
import ProfileEdit from './ProfileEdit';
import { ProfileIntro, OfflinePayments } from './ProfileOnboarding';
import type { RootStackScreenProps } from '../../navigation/types';

const Profile = (props: RootStackScreenProps<'Profile'>): ReactElement => {
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
};

const ProfileScreen = ({
	navigation,
}: RootStackScreenProps<'Profile'>): ReactElement => {
	const [showCopy, setShowCopy] = useState(false);
	const { url } = useSelectedSlashtag();
	const { profile } = useProfile(url);

	const [view, setView] = useState('qr');

	const switchView = (): void => {
		view === 'details' ? setView('qr') : setView('details');
	};

	// const onSwipeLeft = (): void => {
	// 	navigation.navigate('Tabs');
	// };

	const handleCopyButton = (): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	};

	const profileLinks = profile?.links ?? [];
	const profileLinksWithIds = profileLinks.map((link) => ({
		...link,
		id: `${link.title}:${link.url}`,
	}));

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
							<IconButton onPress={switchView}>
								{view === 'qr' ? (
									<InfoIcon height={20} width={20} color="brand" />
								) : (
									<QrPage height={20} width={20} color="brand" />
								)}
							</IconButton>
							<IconButton
								onPress={(): void => {
									url && handleCopyButton();
								}}>
								<CopyIcon height={24} width={24} color="brand" />
							</IconButton>
							<IconButton
								onPress={(): void => {
									url &&
										Share.share({
											title: 'Share Slashtag url',
											message: url,
										});
								}}>
								<ShareIcon height={24} width={24} color="brand" />
							</IconButton>
							<IconButton
								onPress={(): void => {
									navigation.navigate('ProfileEdit');
								}}>
								<PencileIcon height={20} width={20} color="brand" />
							</IconButton>
							<IconButton
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
							<QRView url={url} profile={profile} />
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

const IconButton = ({
	children,
	onPress,
}: {
	children?: any;
	onPress?: () => void;
}): ReactElement => {
	return (
		<TouchableOpacity
			color="white08"
			activeOpacity={0.7}
			onPress={onPress}
			style={styles.iconContainer}>
			{children}
		</TouchableOpacity>
	);
};

const QRView = ({
	url,
	profile,
}: {
	url: string;
	profile?: BasicProfile;
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

	const handleCopy = (): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	};

	const handleCopyQrCode = (): void => {
		console.log('TODO: copy QR code');
	};

	const name = profile?.name ?? '';
	const firstName = name.split(/\s+/)[0];

	return (
		<View style={styles.qrViewContainer}>
			<View style={styles.qrContainer}>
				<TouchableOpacity
					color="white"
					activeOpacity={1}
					onPress={handleCopy}
					onLongPress={handleCopyQrCode}>
					<QR
						value={url}
						size={qrSize}
						logo={{ uri: profile?.image || '' }}
						logoBackgroundColor={profile?.image ? '#fff' : 'transparent'}
						logoSize={50}
						logoBorderRadius={999}
						logoMargin={9}
						quietZone={20}
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

export default Profile;
