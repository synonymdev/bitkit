import React, { memo, ReactElement, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { rootNavigation } from '../navigation/root/RootNavigator';
import { TouchableOpacity } from '../styles/components';
import { Text01M } from '../styles/text';
import {
	SettingsIcon,
	ListIcon,
	TrashIcon,
	QuestionMarkIcon,
} from '../styles/icons';
import { useAppDispatch } from '../hooks/redux';
import { useSlashfeed } from '../hooks/widgets';
import { deleteWidget } from '../store/slices/widgets';
import Dialog from './Dialog';
import SvgImage from './SvgImage';
import LoadingView from './LoadingView';

const BaseFeedWidget = ({
	url,
	name,
	children,
	showTitle,
	isLoading,
	isEditing,
	style,
	onPress,
	onPressIn,
	onLongPress,
	testID,
}: {
	url: string;
	name?: string;
	children: ReactElement;
	showTitle?: boolean;
	isLoading?: boolean;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	onPressIn?: () => void;
	onLongPress?: () => void;
	testID?: string;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();
	const { config, icon } = useSlashfeed({ url });
	const [showDialog, setShowDialog] = useState(false);

	const widgetName = name ?? config?.name ?? url;

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
				color="white10"
				activeOpacity={0.9}
				testID={testID}
				onPress={onPress}
				onPressIn={onPressIn}
				onLongPress={onLongPress}>
				{(showTitle || isEditing) && (
					<View style={styles.header}>
						<View style={styles.title}>
							<View style={styles.icon}>
								{icon ? (
									<SvgImage image={icon} size={32} />
								) : (
									<QuestionMarkIcon width={32} height={32} />
								)}
							</View>

							<Text01M style={styles.name} numberOfLines={1}>
								{widgetName}
							</Text01M>
						</View>

						{isEditing && (
							<View style={styles.actions}>
								<TouchableOpacity
									style={styles.actionButton}
									color="transparent"
									testID="WidgetActionDelete"
									onPress={onDelete}>
									<TrashIcon width={22} />
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.actionButton}
									color="transparent"
									testID="WidgetActionEdit"
									onPress={onEdit}>
									<SettingsIcon width={22} />
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.actionButton}
									color="transparent"
									activeOpacity={0.9}
									testID="WidgetActionDrag"
									onLongPress={onLongPress}
									onPressIn={onPressIn}>
									<ListIcon color="white" width={24} />
								</TouchableOpacity>
							</View>
						)}
					</View>
				)}

				{showTitle && !isEditing && <View style={styles.spacer} />}

				{!isEditing && (
					<LoadingView
						style={styles.content}
						loading={!!isLoading}
						delay={1000}>
						{children}
					</LoadingView>
				)}
			</TouchableOpacity>

			<Dialog
				visible={showDialog}
				title={t('widget_delete_title')}
				description={t('widget_delete_desc', { name })}
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
	spacer: {
		height: 16,
	},
	content: {
		justifyContent: 'center',
	},
});

export default memo(BaseFeedWidget);
