import { useNavigation } from '@react-navigation/native';
import React, { memo, ReactElement, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { widgets } from '../../constants/widgets';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { RootNavigationProp } from '../../navigation/types';
import { showWidgetTitlesSelector } from '../../store/reselect/settings';
import { deleteWidget } from '../../store/slices/widgets';
import { TWidgetId } from '../../store/types/widgets';
import { TouchableOpacity } from '../../styles/components';
import { ListIcon, SettingsIcon, TrashIcon } from '../../styles/icons';
import { BodyMSB } from '../../styles/text';
import { truncate } from '../../utils/helpers';
import Dialog from '../Dialog';
// import LoadingView from '../LoadingView';

const BaseWidget = ({
	id,
	children,
	// isLoading,
	isEditing,
	style,
	testID,
	onPress,
	onPressIn,
	onLongPress,
}: {
	id: TWidgetId;
	children: ReactNode;
	// isLoading?: boolean;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
	onPressIn?: () => void;
	onLongPress?: () => void;
}): ReactElement => {
	const { t } = useTranslation('widgets');
	const navigation = useNavigation<RootNavigationProp>();
	const dispatch = useAppDispatch();
	const [showDialog, setShowDialog] = useState(false);
	const showTitle = useAppSelector(showWidgetTitlesSelector);

	const widget = {
		name: t(`${id}.name`),
		icon: widgets[id].icon,
	};

	const onEdit = (): void => {
		navigation.navigate('Widget', { id });
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
							<SvgXml
								style={styles.icon}
								xml={widget.icon}
								width={32}
								height={32}
							/>
							<BodyMSB style={styles.name} numberOfLines={1}>
								{truncate(widget.name, 18)}
							</BodyMSB>
						</View>

						{isEditing && (
							<View style={styles.actions}>
								<TouchableOpacity
									style={styles.actionButton}
									color="transparent"
									hitSlop={{ top: 15, bottom: 15 }}
									testID="WidgetActionDelete"
									onPress={onDelete}>
									<TrashIcon width={22} />
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.actionButton}
									color="transparent"
									hitSlop={{ top: 15, bottom: 15 }}
									testID="WidgetActionEdit"
									onPress={onEdit}>
									<SettingsIcon width={22} />
								</TouchableOpacity>
								<TouchableOpacity
									style={styles.actionButton}
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

				{!isEditing && children}

				{/* {!isEditing && (
					<LoadingView
						style={styles.content}
						loading={!!isLoading}
						delay={1000}>
						{children}
					</LoadingView>
				)} */}
			</TouchableOpacity>

			<Dialog
				visible={showDialog}
				title={t('delete.title')}
				description={t('delete.description', { name: widget.name })}
				confirmText={t('delete_yes')}
				onCancel={(): void => {
					setShowDialog(false);
				}}
				onConfirm={(): void => {
					dispatch(deleteWidget(id));
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

export default memo(BaseWidget);
