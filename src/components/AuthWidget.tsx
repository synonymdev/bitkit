import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Client } from '@synonymdev/slashtags-auth';
import { useTranslation } from 'react-i18next';

import { useProfile, useSelectedSlashtag } from '../hooks/slashtags';
import { TouchableOpacity, View } from '../styles/components';
import { Text01M } from '../styles/text';
import { KeyIcon, ListIcon, TrashIcon } from '../styles/icons';
import { showErrorNotification } from '../utils/notifications';
import Button from './Button';
import ProfileImage from './ProfileImage';
import { IWidget } from '../store/types/widgets';
import { deleteWidget } from '../store/actions/widgets';
import Dialog from './Dialog';

const AuthWidget = ({
	url,
	widget,
	isEditing = false,
	onLongPress,
	onPressIn,
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const [showButtons, setShowButtons] = useState(false);
	const [showDialog, setShowDialog] = useState(false);

	const { profile } = useProfile(url, { resolve: true });
	const { slashtag } = useSelectedSlashtag();

	const switchShowButtons = (): void => {
		setShowButtons((b) => !b);
	};

	const client = useMemo(() => {
		return new Client(slashtag);
	}, [slashtag]);

	const openMagicLink = useCallback(async () => {
		const magiclink = await client.magiclink(url).catch((e: Error) => {
			showErrorNotification({
				title: t('auth_error_link'),
				message:
					e.message === 'channel closed' ? t('auth_error_peer') : e.message,
			});
		});

		if (magiclink) {
			Linking.openURL(magiclink.url).catch((e) => {
				showErrorNotification({
					title: t('auth_error_open'),
					message: e.message,
				});
			});
		}
	}, [client, url, t]);

	const onDelete = (): void => {
		setShowDialog(true);
	};

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={switchShowButtons}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			activeOpacity={0.9}>
			<View style={styles.left}>
				<ProfileImage
					style={styles.icon}
					url={url}
					image={profile?.image}
					size={32}
				/>
				<Text01M>{profile?.name || ' '}</Text01M>
			</View>
			<View style={styles.right}>
				{showButtons && widget.magiclink && !isEditing && (
					<View style={styles.buttonsContainer}>
						<Button
							text={t('auth_signin')}
							onPress={openMagicLink}
							icon={<KeyIcon color="brand" width={20} height={20} />}
						/>
					</View>
				)}
				{isEditing && (
					<View style={styles.buttonsContainer}>
						<TouchableOpacity style={styles.actionButton} onPress={onDelete}>
							<TrashIcon width={22} />
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.actionButton}
							onLongPress={onLongPress}
							onPressIn={onPressIn}
							activeOpacity={0.9}>
							<ListIcon color="white" width={24} />
						</TouchableOpacity>
					</View>
				)}
			</View>
			<Dialog
				visible={showDialog}
				title={t('widget_delete_title', { name: profile.name })}
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
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	left: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	right: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	icon: {
		marginRight: 16,
		borderRadius: 6.4,
		overflow: 'hidden',
	},
	buttonsContainer: {
		position: 'absolute',
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionButton: {
		paddingHorizontal: 10,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(AuthWidget);
