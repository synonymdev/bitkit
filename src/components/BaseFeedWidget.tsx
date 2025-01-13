import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useSlashfeed } from '../hooks/widgets';
import { rootNavigation } from '../navigation/root/RootNavigator';
import { showWidgetTitlesSelector } from '../store/reselect/settings';
import { deleteWidget } from '../store/slices/widgets';
import { TouchableOpacity } from '../styles/components';
import {
	ListIcon,
	QuestionMarkIcon,
	SettingsIcon,
	TrashIcon,
} from '../styles/icons';
import { BodyMSB } from '../styles/text';
import { truncate } from '../utils/helpers';
import Dialog from './Dialog';
import LoadingView from './LoadingView';
import SvgImage from './SvgImage';

const BaseFeedWidget = ({
	url,
	name,
	children,
	isLoading,
	isEditing,
	style,
	testID,
	onPress,
	onPressIn,
	onLongPress,
}: {
	url: string;
	name?: string;
	children: ReactElement;
	isLoading?: boolean;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
	onPressIn?: () => void;
	onLongPress?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();
	const { config, icon } = useSlashfeed({ url });
	const [showDialog, setShowDialog] = useState(false);
	const showTitle = useAppSelector(showWidgetTitlesSelector);

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

							<BodyMSB style={styles.name} numberOfLines={1}>
								{truncate(widgetName, 18)}
							</BodyMSB>
						</View>

						{isEditing && (
							<View style={styles.actions}>
								<TouchableOpacity
									style={styles.actionButton}
									activeOpacity={0.7}
									color="transparent"
									hitSlop={{ top: 15, bottom: 15 }}
									testID="WidgetActionDelete"
									onPress={onDelete}>
									<TrashIcon width={22} />
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.actionButton}
									activeOpacity={0.7}
									color="transparent"
									hitSlop={{ top: 15, bottom: 15 }}
									testID="WidgetActionEdit"
									onPress={onEdit}>
									<SettingsIcon width={22} />
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.actionButton}
									activeOpacity={0.7}
									color="transparent"
									hitSlop={{ top: 15, bottom: 15 }}
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
	},
	spacer: {
		height: 16,
	},
	content: {
		justifyContent: 'center',
	},
});

export default memo(BaseFeedWidget);
