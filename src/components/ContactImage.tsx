import React, { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useProfile2 } from '../hooks/slashtags2';
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
	const { profile } = useProfile2(url);
	return (
		<ProfileImage style={style} url={url} image={profile.image} size={size} />
	);
};

export default ContactImage;
