import React from 'react';
import { Text01M, View } from '../styles/components';
import { TouchableOpacity } from 'react-native-gesture-handler';
import ProfileImage from './ProfileImage';
import { SlashtagURL } from './SlashtagURL';
import { useRemote } from '../hooks/slashtags';

export const ContactItem = ({
	url,
	name,
	navigation,
	isContact = true,
}: {
	url: string;
	name: string;
	navigation: any;
	isContact?: boolean;
}): JSX.Element => {
	const { remote } = useRemote(url);
	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={(): void => {
				navigation.navigate(isContact ? 'Contact' : 'Profile', { url });
			}}>
			<View style={styles.container}>
				<ProfileImage url={url} image={remote?.profile?.image} size={48} />
				<View style={styles.column}>
					<Text01M style={styles.name}>{name}</Text01M>
					<SlashtagURL color="gray" url={url} />
				</View>
			</View>
		</TouchableOpacity>
	);
};

const styles = {
	container: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
		marginBottom: 10,
	},
	column: {
		marginLeft: 16,
	},
	name: { marginBottom: 4 },
};

export default ContactItem;
