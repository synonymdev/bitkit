import React, { ReactElement, memo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { TouchableOpacity } from '../styles/components';
import { Text02M } from '../styles/text';
import { useProfile } from '../hooks/slashtags';
import ProfileImage from './ProfileImage';
import { XIcon } from '../styles/icons';

const ContactSmall = ({
	url,
	size = 'small',
	style,
	onPress,
	onDelete,
	testID,
}: {
	url: string;
	size?: 'small' | 'large';
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	onDelete?: () => void;
	testID?: string;
}): ReactElement => {
	const { profile } = useProfile(url);

	return (
		<TouchableOpacity
			style={[
				styles.container,
				size === 'large' && styles.containerLarge,
				style,
			]}
			color="white05"
			activeOpacity={onPress ? 0.6 : 1}
			onPress={onPress}
			testID={testID}>
			<ProfileImage
				url={url}
				image={profile.image}
				size={size === 'large' ? 32 : 24}
			/>
			<Text02M numberOfLines={1} style={styles.name}>
				{profile.name}
			</Text02M>
			{onDelete && (
				<TouchableOpacity
					style={styles.delete}
					color="transparent"
					onPress={onDelete}>
					<XIcon color="gray1" width={16} />
				</TouchableOpacity>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		borderRadius: 8,
		minHeight: 36,
		minWidth: 100,
		paddingHorizontal: 8,
	},
	containerLarge: {
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	name: {
		marginLeft: 8,
	},
	delete: {
		paddingLeft: 12,
		paddingRight: 12,
		marginRight: -12,
	},
});

export default memo(ContactSmall);
