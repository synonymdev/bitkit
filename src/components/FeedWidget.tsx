import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';

import { navigate } from '../navigation/root/RootNavigator';
import {
	GearIcon,
	TouchableOpacity,
	View,
	Text01M,
	Caption13M,
	TrashIcon,
} from '../styles/components';
import Button from './Button';
import ProfileImage from './ProfileImage';
import { IWidget } from '../store/types/widgets';
import { useFeedWidget } from '../hooks/widgets';
import { deleteWidget } from '../store/actions/widgets';
import Dialog from './Dialog';

const DefaultRightComponent = ({ value }: { value?: string }): ReactElement => {
	return <Text01M numberOfLines={1}>{value}</Text01M>;
};

export const FeedWidget = ({
	url,
	widget,
	icon,
	name,
	isEditing = false,
	onPress,
}: {
	url: string;
	widget: IWidget;
	icon?: ReactElement;
	name?: string;
	isEditing?: boolean;
	onPress?: () => void;
}): ReactElement => {
	const { value } = useFeedWidget({ url, feed: widget.feed });

	return (
		<BaseFeedWidget
			url={url}
			name={name || widget.feed.name}
			label={widget.feed.field.name}
			isEditing={isEditing}
			onPress={onPress}
			right={<DefaultRightComponent value={value?.toString()} />}
			icon={
				icon || (
					<ProfileImage
						style={styles.icon}
						url={url}
						image={widget.feed.icon}
						size={32}
					/>
				)
			}
		/>
	);
};

export const BaseFeedWidget = ({
	url,
	name,
	icon,
	label,
	right = <View />,
	middle,
	isEditing = false,
	onPress,
}: {
	url: string;
	name?: string;
	icon?: ReactElement;
	label?: string;
	right?: ReactElement;
	middle?: ReactElement;
	isEditing?: boolean;
	onPress?: () => void;
}): ReactElement => {
	const [showDialog, setShowDialog] = useState(false);

	const onEdit = (): void => {
		navigate('WidgetFeedEdit', { url });
	};

	const onDelete = (): void => {
		setShowDialog(true);
	};

	return (
		<TouchableOpacity style={styles.root} activeOpacity={0.9} onPress={onPress}>
			<View style={styles.infoContainer}>
				<View style={styles.icon}>{icon}</View>
				<View style={styles.labelsContainer}>
					<Text01M style={styles.name}>{name}</Text01M>
					<Caption13M color="gray1" style={styles.label}>
						{label}
					</Caption13M>
				</View>
			</View>

			{isEditing ? (
				<>
					<Button
						style={styles.deleteButton}
						icon={<TrashIcon width={20} />}
						onPress={onDelete}
					/>
					<Button
						style={styles.settingsButton}
						icon={<GearIcon width={20} />}
						onPress={onEdit}
					/>
				</>
			) : (
				<View style={styles.dataContainer}>
					{middle && <View style={styles.middle}>{middle}</View>}
					<View style={styles.right}>{right}</View>
				</View>
			)}

			<Dialog
				visible={showDialog}
				title={`Delete ${name} widget?`}
				description={`Are you sure you want to delete ${name} from your widgets?`}
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
	root: {
		height: 88,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	infoContainer: {
		flex: 1,
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
	labelsContainer: {
		flex: 1,
	},
	name: {
		lineHeight: 22,
	},
	label: {
		lineHeight: 18,
	},
	dataContainer: {
		flex: 1,
		flexDirection: 'row',
	},
	middle: {
		flex: 5,
	},
	right: {
		flex: 6,
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	deleteButton: {
		minWidth: 0,
		marginHorizontal: 8,
	},
	settingsButton: {
		minWidth: 0,
	},
});

export default memo(FeedWidget);
