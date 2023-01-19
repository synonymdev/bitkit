import React, { memo, ReactElement, useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { SlashURL } from '@synonymdev/slashtags-sdk';
import b4a from 'b4a';

import { View } from '../styles/components';
import { Caption13M, Text01M } from '../styles/text';
import {
	SettingsIcon,
	LightBulbIcon,
	ListIcon,
	TrashIcon,
} from '../styles/icons';
import { useSlashtagsSDK } from './SlashtagsProvider';
import { showErrorNotification } from '../utils/notifications';
import { rootNavigation } from '../navigation/root/RootNavigator';
import Dialog from './Dialog';
import { deleteWidget } from '../store/actions/widgets';

const FactsWidget = ({
	url,
	isEditing = false,
	onLongPress,
	onPressIn,
}: {
	url: string;
	isEditing?: boolean;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const [showDialog, setShowDialog] = useState(false);
	const [fact, setFact] = useState<string>();
	const sdk = useSlashtagsSDK();

	useEffect(() => {
		let unmounted = false;

		const parsed = SlashURL.parse(url);
		const key = parsed.key;
		const encryptionKey =
			typeof parsed.privateQuery.encryptionKey === 'string'
				? SlashURL.decode(parsed.privateQuery.encryptionKey)
				: undefined;

		const drive = sdk.drive(key, { encryptionKey });

		drive
			.ready()
			.then(() => {
				read();
				drive.core.on('append', read);
			})
			.catch((e: Error) => {
				showErrorNotification({
					title: 'Failed to open news feed drive',
					message: e.message,
				});
			});

		function read(): void {
			const stream = drive.list('/feed');
			const factsFiles: any[] = [];
			stream.on('data', (data: any) => {
				factsFiles.push(data);
			});
			stream.on('end', async () => {
				const blobIndex =
					factsFiles[Math.floor(Math.random() * factsFiles.length)]?.value.blob;
				if (!blobIndex) {
					return;
				}
				const _fact = await drive.blobs
					.get(blobIndex)
					.then((buf: Uint8Array) => buf && b4a.toString(buf))
					.catch(noop);

				!unmounted && _fact && setFact(_fact);
			});
		}

		return function cleanup() {
			unmounted = true;
		};
	}, [sdk, url]);

	const onEdit = (): void => {
		rootNavigation.navigate('WidgetFeedEdit', { url });
	};

	const onDelete = (): void => {
		setShowDialog(true);
	};

	return (
		<View>
			<TouchableOpacity
				style={styles.root}
				activeOpacity={0.9}
				onLongPress={onLongPress}
				onPressIn={onPressIn}>
				<View style={styles.icon}>
					{<LightBulbIcon width={32} height={32} />}
				</View>
				<View style={styles.infoContainer}>
					<Text01M style={styles.name} numberOfLines={1}>
						Bitcoin Facts
					</Text01M>
					<View style={styles.row}>
						<View style={styles.linkContainer}>
							<Caption13M color="gray1" numberOfLines={1}>
								{fact}
							</Caption13M>
						</View>
					</View>
				</View>
			</TouchableOpacity>

			{isEditing && (
				<View style={styles.buttonsContainer}>
					<TouchableOpacity style={styles.actionButton} onPress={onDelete}>
						<TrashIcon width={22} />
					</TouchableOpacity>
					<TouchableOpacity style={styles.actionButton} onPress={onEdit}>
						<SettingsIcon width={22} />
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
			<Dialog
				visible={showDialog}
				title="Delete Bitcoin Facts widget?"
				description="Are you sure you want to delete Bitcoin Facts from your widgets?"
				confirmText="Yes, Delete"
				onCancel={(): void => {
					setShowDialog(false);
				}}
				onConfirm={(): void => {
					deleteWidget(url);
					setShowDialog(false);
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	icon: {
		marginRight: 16,
		borderRadius: 6.4,
		overflow: 'hidden',
		height: 32,
		width: 32,
	},
	infoContainer: {
		flex: 1.2,
		flexDirection: 'column',
		justifyContent: 'flex-start',
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	name: {
		lineHeight: 22,
	},
	linkContainer: {
		flex: 3,
	},
	buttonsContainer: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 1,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	actionButton: {
		paddingHorizontal: 10,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(FactsWidget);

function noop(): void {}
