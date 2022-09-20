import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Text02M, TouchableOpacity } from '../styles/components';
import { useSlashtags } from '../components/SlashtagsProvider';
import ProfileImage from './ProfileImage';

export const ContactSmall = ({
	url,
	onPress,
}: {
	url: string;
	onPress?: Function;
}): JSX.Element => {
	const profile = useSlashtags().contacts[url];

	return (
		<TouchableOpacity
			onPress={onPress}
			color="white05"
			style={styles.container}>
			<ProfileImage url={url} image={profile?.image} size={24} />
			<Text02M style={styles.name}>{profile?.name}</Text02M>
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
