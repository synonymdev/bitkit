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
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useAppSelector } from '../../hooks/redux';
import QRCode from 'react-native-qrcode-svg';
import Share from 'react-native-share';
import { useTranslation } from 'react-i18next';

import {
	ScrollView,
	AnimatedView,
	TouchableOpacity,
	View as ThemedView,
} from '../../styles/components';
import { Text02S } from '../../styles/text';
import {
	CopyIcon,
	PencileIcon,
	ShareIcon,
	UsersIcon,
} from '../../styles/icons';
import { BasicProfile } from '../../store/types/slashtags';
import { onboardingProfileStepSelector } from '../../store/reselect/slashtags';
import { useProfile2, useSelectedSlashtag2 } from '../../hooks/slashtags2';
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
	const onboardingProfileStep = useAppSelector(onboardingProfileStepSelector);

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
	const { url } = useSelectedSlashtag2();
	const { profile } = useProfile2(url);
	const qrRef = useRef<any>();

	const [showCopy, setShowCopy] = useState(false);
	const [isSharing, setIsSharing] = useState(false);

	const handleCopy = useCallback((): void => {
		setShowCopy(() => true);
		setTimeout(() => setShowCopy(() => false), 1200);
		Clipboard.setString(url);
	}, [url]);

	const handleShare = useCallback(async (): Promise<void> => {
		setIsSharing(true);
		try {
			const imageBase64 = await new Promise<string>((resolve, reject) => {
				if (!qrRef.current) {
					reject(new Error('QR code ref not set'));
					return;
				}
				qrRef.current.toDataURL((data: string) => {
					const imageData = data.replace(/(\r\n|\n|\r)/gm, '');
					resolve(imageData);
				});
			});
			const image = `data:image/png;base64,${imageBase64}`;
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
				title={t('profile')}
				actionIcon={<UsersIcon height={24} width={24} />}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
				onActionPress={(): void => {
					navigation.navigate('Contacts');
				}}
			/>

			<ScrollView contentContainerStyle={styles.content}>
				<ProfileCard url={url} profile={profile} resolving={false} />
				<Divider />
				<View style={styles.actions}>
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
				<QRView
					url={url}
					profile={profile}
					qrRef={qrRef}
					onPress={handleCopy}
				/>
				{showCopy && (
					<AnimatedView
						style={styles.tooltip}
						color="transparent"
						entering={FadeIn.duration(500)}
						exiting={FadeOut.duration(500)}>
						<Tooltip testID="ContactCopiedTooltip" text={t('contact_copied')} />
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
	onPress,
}: {
	url: string;
	profile?: BasicProfile;
	qrRef: MutableRefObject<string | undefined>;
	onPress?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dimensions = useWindowDimensions();

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
				onPress={onPress}
				onLongPress={handleCopyQrCode}>
				<QRCode
					value={url}
					size={qrSize}
					quietZone={20}
					getRef={(c): void => (qrRef.current = c)}
				/>
				<View style={styles.qrImageContainer}>
					<ThemedView style={styles.qrImageOuter} color="white">
						<ProfileImage url={url} image={profile?.image} size={68} />
					</ThemedView>
				</View>
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
		top: '70%',
	},
});

export default memo(Profile);
