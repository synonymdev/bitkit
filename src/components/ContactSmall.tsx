import React, { ReactElement, memo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useProfile } from '../hooks/slashtags';
import { TouchableHighlight, TouchableOpacity } from '../styles/components';
import { XIcon } from '../styles/icons';
import { BodySSB } from '../styles/text';
import ProfileImage from './ProfileImage';

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
		<TouchableHighlight
			style={[
				styles.container,
				size === 'large' && styles.containerLarge,
				style,
			]}
			color="white10"
			activeOpacity={onPress ? 0.6 : 1}
			onPress={onPress}
			testID={testID}>
			<>
				<ProfileImage
					url={url}
					image={profile.image}
					size={size === 'large' ? 32 : 24}
				/>
				<BodySSB numberOfLines={1} style={styles.name}>
					{profile.name}
				</BodySSB>
				{onDelete && (
					<TouchableOpacity
						style={styles.delete}
						activeOpacity={0.7}
						color="transparent"
						onPress={onDelete}>
						<XIcon color="secondary" width={16} />
					</TouchableOpacity>
				)}
			</>
		</TouchableHighlight>
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
