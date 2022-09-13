import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { Text02M, View } from '../styles/components';
import ProfileImage from './ProfileImage';
import { useRemote } from '../hooks/slashtags';

export const ContactSmall = ({ url }: { url: string }): JSX.Element => {
	const { remote } = useRemote(url);

	return (
		<View color="white05" style={styles.container}>
			<ProfileImage url={url} image={remote?.profile?.image} size={24} />
			<Text02M style={styles.name}>{remote?.profile?.name}</Text02M>
		</View>
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
