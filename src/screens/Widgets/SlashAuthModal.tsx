import React, { memo, ReactElement, useMemo, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Client } from '@synonymdev/slashtags-auth';
import { SlashURL } from '@synonymdev/slashtags-sdk';
import { useSelector } from 'react-redux';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Button from '../../components/Button';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { toggleView } from '../../store/actions/user';
import { useBottomSheetBackPress } from '../../hooks/bottomSheet';
import Store from '../../store/types';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import { ContactItem } from '../../components/ContactsList';
import { IContactRecord } from '../../store/types/slashtags';
import ProfileImage from '../../components/ProfileImage';
import { Checkmark } from '../../styles/components';
import { Title, Text01S } from '../../styles/components';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../utils/notifications';
import { setAuthWidget } from '../../store/actions/widgets';
import Divider from '../../components/Divider';
import { useSnapPoints } from '../../hooks/bottomSheet';
import { navigate } from '../../navigation/root/RootNavigator';
import HourglassSpinner from '../../components/HourglassSpinner';

export type BackupNavigationProp =
	NativeStackNavigationProp<BackupStackParamList>;

export type BackupStackParamList = {
	ShowMnemonic: undefined;
	ConfirmMnemonic: undefined;
	Result: undefined;
	Metadata: undefined;
};

const Key = ({
	contact,
	active,
	onPress,
}: {
	contact: IContactRecord;
	active: boolean;
	onPress: () => void;
}): ReactElement => {
	return (
		<TouchableOpacity onPress={onPress} activeOpacity={0.9}>
			<View style={keyStyles.row}>
				<ContactItem contact={contact} size="small" onPress={onPress} />
				{active && <Checkmark color="brand" height={32} width={32} />}
			</View>
			<Divider />
		</TouchableOpacity>
	);
};

const _SlashAuthModal = (): ReactElement => {
	const [anonymous, setAnonymous] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const _url = useSelector(
		(state: Store) => state.user.viewController.slashauthModal,
	).url as string;
	const parsed = SlashURL.parse(_url);
	const url = SlashURL.format(parsed.key);

	const { slashtag } = useSelectedSlashtag();
	const { profile } = useProfile(url);

	const server: IContactRecord = useMemo(() => {
		return { url, ...profile, name: profile?.name || '' };
	}, [url, profile]);

	const rootContact: IContactRecord = useMemo(() => {
		return { url: slashtag.url, name: ' ' };
	}, [slashtag]);

	// const sdk = useSlashtagsSDK();

	// const anonymousSlashtag = useMemo(() => {
	// TODO(slashtags): update when slashtag.sub API is added
	// return sdk.slashtag(SlashURL.encode(parsed.key));
	// }, [sdk, parsed.key]);

	// const anonymousContact: IContactRecord = useMemo(() => {
	// return { url: anonymousSlashtag.url, name: 'Anonymous' };
	// }, [anonymousSlashtag]);

	const text = useMemo(() => {
		const s = (server.name || server.url).trim?.();
		if (s) {
			if (isLoading) {
				return `Signing in to ${s}...`;
			} else {
				return `Do you want to sign in to ${s} with your profile?`;
			}
		} else {
			if (isLoading) {
				return 'Signing in...';
			} else {
				return 'Do you want to sign in with your profile?';
			}
		}
	}, [server, isLoading]);

	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const signIn = async (): Promise<void> => {
		setIsLoading(true);

		const client = new Client(slashtag);
		const response = await client.authz(_url).catch((e: Error) => {
			if (e.message === 'channel closed') {
				showErrorNotification({
					title: 'Error while signing in',
					message: 'Could not connect to peer',
				});

				toggleView({
					view: 'slashauthModal',
					data: { isOpen: false },
				});
			}
		});

		if (response.status === 'ok') {
			showSuccessNotification({
				title: 'You’re Signed In!',
				message: `Successfully logged in${
					server.name ? ` to ${server.name}.` : '.'
				}`,
			});

			setAuthWidget(url, { magiclink: true });
			navigate('Tabs');
		} else {
			showErrorNotification({
				title: 'Error while signing in',
				message: response.message,
			});
		}

		setIsLoading(false);

		toggleView({
			view: 'slashauthModal',
			data: { isOpen: false },
		});
	};

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title={isLoading ? 'Signing in...' : 'Sign in'}
				displayBackButton={false}
			/>
			<View style={styles.header}>
				<ProfileImage
					style={styles.headerImage}
					url={server.url}
					image={server?.image}
					size={32}
				/>
				<Title>{server.name}</Title>
			</View>
			<Text01S color="gray1" style={styles.text}>
				{text}
			</Text01S>
			<Key
				contact={rootContact}
				active={!anonymous}
				onPress={(): void => setAnonymous(false)}
			/>
			{/** <Key
				contact={anonymousContact}
				active={anonymous}
				onPress={(): void => setAnonymous(true)}
			/>*/}

			{isLoading && <HourglassSpinner />}

			<View style={buttonContainerStyles}>
				<Button
					size="large"
					text="Sign in"
					disabled={isLoading}
					onPress={signIn}
				/>
			</View>
		</View>
	);
};

export const SlashAuthModal = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	useBottomSheetBackPress('slashauthModal');

	const isOpen = useSelector(
		(state: Store) => state.user.viewController.slashauthModal.isOpen,
	);

	return (
		<BottomSheetWrapper view="slashauthModal" snapPoints={snapPoints}>
			{isOpen ? <_SlashAuthModal /> : <View />}
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	headerImage: {
		marginRight: 16,
		borderRadius: 8,
	},
	text: {
		marginTop: 32,
		marginBottom: 32,
	},
	buttonContainer: {
		marginTop: 'auto',
		width: '100%',
	},
});

const keyStyles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
});

export default memo(SlashAuthModal);
