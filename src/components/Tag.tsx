import React, { ReactElement, memo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { TouchableOpacity } from '../styles/components';
import { TrashIcon, XIcon } from '../styles/icons';
import { BodySSB } from '../styles/text';

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
			<BodySSB testID={`Tag-${value}`}>{value}</BodySSB>
			{onDelete && (
				<TouchableOpacity
					style={styles.icon}
					activeOpacity={0.7}
					color="transparent"
					testID={`Tag-${value}-delete`}
					onPress={onDelete}>
					{icon === 'close' ? (
						<XIcon color="secondary" width={16} />
					) : (
						<TrashIcon color="secondary" width={16} />
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
