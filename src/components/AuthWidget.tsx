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
import { KeyIcon, ListIcon, SettingsIcon, TrashIcon } from '../styles/icons';
import { useProfile, useSelectedSlashtag } from '../hooks/slashtags';
import { showToast } from '../utils/notifications';
import { IWidget } from '../store/types/widgets';
import { deleteWidget } from '../store/actions/widgets';
import Button from './Button';
import Dialog from './Dialog';
import ProfileImage from './ProfileImage';
import { rootNavigation } from '../navigation/root/RootNavigator';

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
	widget: IWidget;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { slashtag } = useSelectedSlashtag();
	const { profile } = useProfile(url);
	const [showDialog, setShowDialog] = useState(false);

	const client = useMemo(() => new Client(slashtag), [slashtag]);

	const onSignIn = useCallback(async () => {
		const magiclink = await client.magiclink(url).catch((e: Error) => {
			showToast({
				type: 'error',
				title: t('auth_error_link'),
				description:
					e.message === 'channel closed' ? t('auth_error_peer') : e.message,
			});
		});

		if (magiclink) {
			Linking.openURL(magiclink.url).catch((e) => {
				showToast({
					type: 'error',
					title: t('auth_error_open'),
					description: e.message,
				});
			});
		}
	}, [client, url, t]);

	const onEdit = (): void => {
		rootNavigation.navigate('Widget', { url });
	};

	const onDelete = (): void => {
		setShowDialog(true);
	};

	return (
		<>
			<TouchableOpacity
				style={[styles.root, style]}
				color="white08"
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
							{widget.fields && (
								<TouchableOpacity
									style={styles.actionButton}
									color="transparent"
									onPress={onEdit}>
									<SettingsIcon width={22} />
								</TouchableOpacity>
							)}
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
					deleteWidget(url);
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
