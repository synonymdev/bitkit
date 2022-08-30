import React, { useState } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { StyleSheet, useWindowDimensions, Share } from 'react-native';
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
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import {
	ProfileIntro,
	PaymentsFromContacts,
	OfflinePayments,
} from './ProfileOnboarding';
import { BasicProfile } from '../../store/types/slashtags';
import ProfileLinks from '../../components/ProfileLinks';
import Tooltip from '../../components/Tooltip';
import ProfileEdit from './ProfileEdit';
import Store from '../../store/types';
import { useSelectedSlashtag } from '../../hooks/slashtags';

export const Profile = ({ navigation }): JSX.Element => {
	const onboardingProfileStep = useSelector(
		(state: Store) => state.slashtags.onboardingProfileStep,
	);

	switch (onboardingProfileStep) {
		case 'Intro':
			return <ProfileIntro navigation={navigation} />;
		case 'InitialEdit':
			return <ProfileEdit navigation={navigation} />;
		case 'PaymentsFromContacts':
			return <PaymentsFromContacts navigation={navigation} />;
		case 'OfflinePayments':
			return <OfflinePayments navigation={navigation} />;
		case 'Done':
			return <ProfileScreen navigation={navigation} />;
		default:
			return <ProfileScreen navigation={navigation} />;
	}
};

const ProfileScreen = ({ navigation }): JSX.Element => {
	const [showCopy, setShowCopy] = useState(false);
	const { url, profile } = useSelectedSlashtag();

	const [view, setView] = useState('qr');

	function switchView(): void {
		view === 'details' ? setView('qr') : setView('details');
	}

	const handleCopyButton = (): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	};

	return (
		<View style={styles.container}>
			<SafeAreaInsets type={'top'} />
			<NavigationHeader
				title="Profile"
				displayBackButton={false}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<ProfileCard url={url} profile={profile} resolving={false} />
				<View style={styles.divider} />
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
							<CopyIcon height={20} width={20} color="brand" />
						</IconButton>
						<IconButton
							onPress={(): void => {
								url &&
									Share.share({
										title: 'Share Slashtag url',
										message: url,
									});
							}}>
							<ShareIcon height={20} width={20} color="brand" />
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
							<UsersIcon height={20} width={20} color="brand" />
						</IconButton>
					</View>
					{view === 'details' ? (
						<ProfileLinks
							links={profile?.links}
							style={styles.profileDetails}
						/>
					) : (
						<QRView url={url as string} profile={profile} />
					)}
					{showCopy && (
						<AnimatedView
							entering={FadeIn.duration(500)}
							exiting={FadeOut.duration(500)}
							color="transparent"
							style={styles.tooltip}>
							<Tooltip text="Slashtags Key Copied To clipboard" />
						</AnimatedView>
					)}
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
}): JSX.Element => {
	const { height } = useWindowDimensions();
	return (
		<View style={styles.qrViewContainer}>
			<View style={styles.qrContainer}>
				<QR
					value={url}
					size={height / 3.25}
					logo={{ uri: profile?.image || '' }}
					logoBackgroundColor={profile?.image ? '#fff' : 'transparent'}
					logoSize={70}
					logoBorderRadius={999}
					logoMargin={10}
					quietZone={20}
				/>
			</View>
			<Text02S style={styles.qrViewNote}>Scan to add {profile?.name}</Text02S>
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
		height: 2,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginTop: 16,
		marginBottom: 16,
	},
	bottom: {
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 9999,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	bottomHeader: {
		display: 'flex',
		flexDirection: 'row',
	},
	qrViewContainer: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
	qrContainer: {
		borderRadius: 0,
		marginTop: 20,
		overflow: 'hidden',
	},
	qrViewNote: {
		marginTop: 16,
	},
	profileDetails: {
		marginTop: 32,
	},
	tooltip: {
		position: 'absolute',
		alignSelf: 'center',
		bottom: -20,
	},
});

export default Profile;
