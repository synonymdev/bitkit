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
import { useTranslation } from 'react-i18next';

import {
	AnimatedView,
	TouchableOpacity,
	View as ThemedView,
} from '../../styles/components';
import { Text02S } from '../../styles/text';
import {
	CopyIcon,
	InfoIcon,
	PencileIcon,
	ShareIcon,
	UsersIcon,
} from '../../styles/icons';
import { BasicProfile } from '../../store/types/slashtags';
import { onboardingProfileStepSelector } from '../../store/reselect/slashtags';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import { truncate } from '../../utils/helpers';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import ProfileCard from '../../components/ProfileCard';
import Tooltip from '../../components/Tooltip';
import Divider from '../../components/Divider';
import IconButton from '../../components/IconButton';
import ProfileImage from '../../components/ProfileImage';
import ProfileEdit from './ProfileEdit';
import { ProfileIntro, OfflinePayments } from './ProfileOnboarding';
import type { RootStackScreenProps } from '../../navigation/types';

const Profile = memo((props: RootStackScreenProps<'Profile'>): ReactElement => {
	const onboardingProfileStep = useSelector(onboardingProfileStepSelector);

	switch (onboardingProfileStep) {
		case 'Intro':
			return <ProfileIntro {...props} />;
		case 'InitialEdit':
			return <ProfileEdit {...props} />;
		case 'OfflinePayments':
			return <OfflinePayments {...props} />;
		case 'Done':
		default:
			return <ProfileScreen {...props} />;
	}
});

const ProfileScreen = ({
	navigation,
}: RootStackScreenProps<'Profile'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { url } = useSelectedSlashtag();
	const { profile } = useProfile(url);
	const qrRef = useRef<string>();

	const [showCopy, setShowCopy] = useState(false);
	const [isSharing, setIsSharing] = useState(false);

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
				title: t('contact_share'),
				message: url,
				url: image,
				type: 'image/png',
			});
		} catch (e) {
			console.log(e);
		} finally {
			setIsSharing(false);
		}
	}, [url, t]);

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				style={styles.header}
				title={t('profile')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
				onActionPress={(): void => {
					navigation.navigate('Contacts');
				}}
				actionIcon={<UsersIcon height={24} width={24} />}
			/>

			<ScrollView contentContainerStyle={styles.content}>
				<ProfileCard url={url} profile={profile} resolving={false} />
				<Divider />
				<View style={styles.actions}>
					<IconButton
						testID="DetailsButton"
						style={styles.iconButton}
						onPress={(): void => {
							navigation.navigate('ProfileDetails');
						}}>
						<InfoIcon height={20} width={20} color="brand" />
					</IconButton>
					<IconButton
						testID="CopyButton"
						style={styles.iconButton}
						onPress={handleCopy}>
						<CopyIcon height={24} width={24} color="brand" />
					</IconButton>
					<IconButton
						style={styles.iconButton}
						disabled={isSharing}
						onPress={handleShare}>
						<ShareIcon height={24} width={24} color="brand" />
					</IconButton>
					<IconButton
						testID="EditButton"
						style={styles.iconButton}
						onPress={(): void => {
							navigation.navigate('ProfileEdit');
						}}>
						<PencileIcon height={20} width={20} color="brand" />
					</IconButton>
				</View>
				<QRView url={url} profile={profile} qrRef={qrRef} />
				{showCopy && (
					<AnimatedView
						entering={FadeIn.duration(500)}
						exiting={FadeOut.duration(500)}
						color="transparent"
						style={styles.tooltip}>
						<Tooltip text={t('contact_copied')} />
					</AnimatedView>
				)}
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
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
	qrRef: MutableRefObject<string | undefined>;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
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

	const name = useMemo(() => profile?.name ?? t('profile'), [profile?.name, t]);
	const firstName = useMemo(() => name.split(/\s+/)[0], [name]);

	return (
		<View style={styles.qrViewContainer}>
			<TouchableOpacity
				style={styles.qrCode}
				color="white"
				activeOpacity={1}
				onPress={handleCopy}
				onLongPress={handleCopyQrCode}>
				<QRCode
					value={url}
					size={qrSize}
					quietZone={20}
					getRef={(c): void => {
						if (c) {
							c.toDataURL((data: string) => (qrRef.current = data));
						}
					}}
				/>
				<View style={styles.qrImageContainer}>
					<ThemedView style={styles.qrImageOuter} color="white">
						<ProfileImage url={url} image={profile?.image} size={68} />
					</ThemedView>
				</View>

				{showCopy && (
					<AnimatedView
						style={styles.tooltip}
						color="transparent"
						entering={FadeIn.duration(500)}
						exiting={FadeOut.duration(500)}>
						<Tooltip testID="ContactCopiedTooltip" text={t('contact_copied')} />
					</AnimatedView>
				)}
			</TouchableOpacity>

			<Text02S style={styles.qrViewNote}>
				{t('profile_scan_to_add', { name: truncate(firstName, 30) })}
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
		flexGrow: 1,
		paddingTop: 23,
		paddingHorizontal: 16,
	},
	actions: {
		flexDirection: 'row',
	},
	iconButton: {
		marginRight: 16,
	},
	qrViewContainer: {
		alignItems: 'center',
		flex: 1,
	},
	qrCode: {
		borderRadius: 10,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 32,
		overflow: 'hidden',
	},
	qrImageContainer: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
	},
	qrImageOuter: {
		borderRadius: 50,
		padding: 9,
	},
	qrViewNote: {
		marginTop: 16,
	},
	tooltip: {
		position: 'absolute',
		alignSelf: 'center',
		top: '66%',
	},
});

export default memo(Profile);
