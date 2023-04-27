import React, { ReactElement, memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from '../styles/components';
import { Text02M } from '../styles/text';
import { XIcon } from '../styles/icons';

interface ITag {
	value: string;
	style?: {};
	onPress?: () => void;
	onClose?: () => void;
	testID?: string;
}
const Tag = ({
	value,
	style,
	onPress,
	onClose,
	testID,
}: ITag): ReactElement => {
	const tagStyle = useMemo(
		() => StyleSheet.compose(styles.root, style),
		[style],
	);

	return (
		<TouchableOpacity color="transparent" style={tagStyle} onPress={onPress}>
			<Text02M style={styles.text} testID={testID}>
				{value}
			</Text02M>
			{onClose && (
				<TouchableOpacity
					style={styles.close}
					color="transparent"
					onPress={onClose}
					testID={testID ? `${testID}-close` : undefined}>
					<XIcon color="gray1" width={16} />
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
	},
	close: {
		marginLeft: -12,
		paddingLeft: 12,
		paddingRight: 15,
		alignSelf: 'stretch',
		justifyContent: 'center',
	},
	text: {
		marginHorizontal: 12,
	},
});

export default memo(Tag);
