import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { View, Linking, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Client } from '@synonymdev/slashtags-auth';
import { useTranslation } from 'react-i18next';

import { Text01M } from '../styles/text';
import { TouchableOpacity } from '../styles/components';
import { KeyIcon, ListIcon, TrashIcon } from '../styles/icons';
import { useAppDispatch } from '../hooks/redux';
import { useProfile, useSelectedSlashtag } from '../hooks/slashtags';
import { showToast } from '../utils/notifications';
import { TAuthWidget } from '../store/types/widgets';
import { deleteWidget } from '../store/slices/widgets';
import Button from './Button';
import Dialog from './Dialog';
import ProfileImage from './ProfileImage';

const AuthWidget = ({
	url,
	widget,
	isEditing = false,
	style,
	testID,
	onLongPress,
	onPressIn,
}: {
	url: string;
	widget: TAuthWidget;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();
	const { slashtag } = useSelectedSlashtag();
	const { profile } = useProfile(url);
	const [showDialog, setShowDialog] = useState(false);
	const [isSigningIn, setIsSigningIn] = useState(false);

	const client = useMemo(() => new Client(slashtag), [slashtag]);

	const onSignIn = useCallback(async () => {
		setIsSigningIn(true);

		const magiclink = await client.magiclink(url).catch((e: Error) => {
			console.log(e.message);
			const message =
				e.message === 'channel closed'
					? t('auth_error_peer')
					: `An error occurred: ${e.message}`;

			showToast({
				type: 'error',
				title: t('auth_error_link'),
				description: message,
			});
		});

		if (magiclink) {
			Linking.openURL(magiclink.url).catch((e) => {
				showToast({
					type: 'error',
					title: t('auth_error_link'),
					description: e.message,
				});
			});
		}

		setIsSigningIn(false);
	}, [client, url, t]);

	const onDelete = (): void => {
		setShowDialog(true);
	};

	return (
		<>
			<TouchableOpacity
				style={[styles.root, style]}
				color="white10"
				activeOpacity={0.9}
				testID={testID}
				onPressIn={onPressIn}
				onLongPress={onLongPress}>
				<View style={styles.header}>
					<View style={styles.title}>
						<ProfileImage
							style={styles.icon}
							url={url}
							image={profile?.image}
							size={32}
						/>

						<Text01M style={styles.name} numberOfLines={1}>
							{profile?.name || ' '}
						</Text01M>
					</View>

					{!isEditing && widget.magiclink && (
						<View style={styles.actions}>
							<Button
								style={styles.signInButton}
								text={t('auth_signin')}
								icon={<KeyIcon color="white" width={16} height={16} />}
								loading={isSigningIn}
								onPress={onSignIn}
							/>
						</View>
					)}

					{isEditing && (
						<View style={styles.actions}>
							<TouchableOpacity
								style={styles.actionButton}
								color="transparent"
								onPress={onDelete}>
								<TrashIcon width={22} />
							</TouchableOpacity>
							<TouchableOpacity
								style={styles.actionButton}
								color="transparent"
								activeOpacity={0.9}
								onLongPress={onLongPress}
								onPressIn={onPressIn}>
								<ListIcon color="white" width={24} />
							</TouchableOpacity>
						</View>
					)}
				</View>
			</TouchableOpacity>

			<Dialog
				visible={showDialog}
				title={t('widget_delete_title')}
				description={t('widget_delete_desc', { name: profile.name })}
				confirmText={t('widget_delete_yes')}
				onCancel={(): void => {
					setShowDialog(false);
				}}
				onConfirm={(): void => {
					dispatch(deleteWidget(url));
					setShowDialog(false);
				}}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	root: {
		borderRadius: 16,
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	title: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	icon: {
		marginRight: 16,
		borderRadius: 6.4,
		overflow: 'hidden',
		height: 32,
		width: 32,
	},
	name: {
		lineHeight: 22,
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	actionButton: {
		alignItems: 'center',
		justifyContent: 'center',
		width: 32,
		height: 32,
		marginLeft: 8,

		// increase hitbox
		paddingTop: 30,
		marginTop: -30,
		paddingBottom: 30,
		marginBottom: -30,
	},
	signInButton: {
		height: 32,
		paddingHorizontal: 16,
		minWidth: 0,
	},
});

export default memo(AuthWidget);
