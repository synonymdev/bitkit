import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { TouchableOpacity } from '../styles/components';
import { Text02M } from '../styles/text';
import { useProfile } from '../hooks/slashtags';
import ProfileImage from './ProfileImage';

export const ContactSmall = ({
	url,
	onPress,
}: {
	url: string;
	onPress?: () => void;
}): JSX.Element => {
	const { profile } = useProfile(url);

	return (
		<TouchableOpacity
			onPress={onPress}
			color="white05"
			style={styles.container}>
			<ProfileImage url={url} image={profile?.image} size={24} />
			<Text02M numberOfLines={1} style={styles.name}>
				{profile?.name}
			</Text02M>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,
		height: 36,
		minWidth: 100,
		paddingHorizontal: 8,
		alignSelf: 'flex-start',
	},
	name: {
		marginLeft: 8,
	},
});

export default memo(ContactSmall);
