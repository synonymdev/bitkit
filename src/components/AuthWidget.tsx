import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { Linking, StyleSheet } from 'react-native';
import { Client } from '@synonymdev/slashtags-auth';

import { useProfile, useSelectedSlashtag } from '../hooks/slashtags';
import {
	Text01M,
	TouchableOpacity,
	TrashIcon,
	View,
} from '../styles/components';
import { showErrorNotification } from '../utils/notifications';
import Button from './Button';
import ProfileImage from './ProfileImage';
import { IWidget } from '../store/types/widgets';
import { deleteWidget } from '../store/actions/widgets';
import Dialog from './Dialog';

const AuthWidget = ({
	url,
	widget,
}: {
	url: string;
	widget: IWidget;
}): ReactElement => {
	const [showButtons, setShowButtons] = useState(false);
	const [showDialog, setShowDialog] = useState(false);

	const { profile } = useProfile(url);
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
				title: 'Failed to get login link',
				message:
					e.message === 'channel closed'
						? 'Could not connect to peer'
						: e.message,
			});
		});

		Linking.openURL(magiclink.url).catch((e) => {
			showErrorNotification({
				title: 'Error opening login link',
				message: e.message,
			});
		});
	}, [client, url]);

	const onDelete = (): void => {
		setShowDialog(true);
	};

	return (
		<TouchableOpacity
			style={styles.container}
			onPress={switchShowButtons}
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
				{showButtons ? (
					<View style={styles.buttonsContainer}>
						{widget.magiclink && (
							<>
								<Button
									style={styles.deleteButton}
									icon={<TrashIcon width={20} />}
									onPress={onDelete}
								/>
								<Button text="Sign in" onPress={openMagicLink} />
							</>
						)}
					</View>
				) : (
					<View />
				)}
			</View>
			<Dialog
				visible={showDialog}
				title={`Delete ${profile.name} auth widget?`}
				description={`Are you sure you want to delete ${profile.name} from your widgets?`}
				confirmText="Yes, Delete"
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
	deleteButton: {
		minWidth: 0,
		marginHorizontal: 8,
	},
});

export default memo(AuthWidget);
