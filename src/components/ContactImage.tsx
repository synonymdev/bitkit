import React, { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useProfile } from '../hooks/slashtags';
import ProfileImage from './ProfileImage';

const ContactImage = ({
	url,
	size = 24,
	style,
}: {
	url: string;
	size?: number;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { profile } = useProfile(url);
	return (
		<ProfileImage style={style} url={url} image={profile.image} size={size} />
	);
};

export default ContactImage;
