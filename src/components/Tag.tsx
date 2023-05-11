import React, { ReactElement, memo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { TouchableOpacity } from '../styles/components';
import { Text02M } from '../styles/text';
import { TrashIcon, XIcon } from '../styles/icons';

interface ITag {
	value: string;
	icon?: 'close' | 'trash';
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	onDelete?: () => void;
}

const Tag = ({
	value,
	icon = 'close',
	style,
	onPress,
	onDelete,
}: ITag): ReactElement => {
	return (
		<TouchableOpacity
			style={[styles.root, style]}
			activeOpacity={onPress ? 0.2 : 1}
			color="transparent"
			onPress={onPress}>
			<Text02M testID={`Tag-${value}`}>{value}</Text02M>
			{onDelete && (
				<TouchableOpacity
					style={styles.icon}
					color="transparent"
					onPress={onDelete}
					testID={`Tag-${value}-delete`}>
					{icon === 'close' ? (
						<XIcon color="gray1" width={16} />
					) : (
						<TrashIcon color="gray1" width={16} />
					)}
				</TouchableOpacity>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	root: {
		height: 32,
		borderWidth: 1,
		borderRadius: 8,
		borderColor: 'rgba(255, 255, 255, 0.16)',
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
	},
	icon: {
		paddingLeft: 8,
		marginRight: -10,
		paddingRight: 10,
	},
});

export default memo(Tag);
