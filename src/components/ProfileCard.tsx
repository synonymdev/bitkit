import React, { useRef } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
	Text,
	Title,
	TextInputNoOutline,
	CameraIcon,
} from '../styles/components';
import { profileNameMultiLine } from '../utils/helpers';
import ProfileImage from './ProfileImage';
import { SlashtagURL } from './SlashtagURL';
import { BasicProfile } from '../store/types/slashtags';

export const ProfileCard = ({
	url,
	profile,
	editable,
	onChange,
	contact,
	resolving,
}: {
	url: string;
	profile?: BasicProfile;
	editable?: boolean;
	contact?: boolean;
	onChange?: (name, val) => void;
	resolving: boolean;
}): JSX.Element => {
	const name = profile?.name;
	const bio = profile?.bio?.slice?.(0, 160);

	const bioRef = useRef<TextInput | null>(null);

	return (
		<>
			<View style={styles.row}>
				<View style={styles.text}>
					{editable && !resolving ? (
						<TextInputNoOutline
							autoFocus={!name}
							// placeholder doesn't like the lineHeight
							style={[styles.name, name && styles.nameFilled]}
							value={name}
							placeholder={
								contact ? "Contact's name" : 'Your public\nprofile name'
							}
							multiline={true}
							onChangeText={(value): void => {
								if (value.slice(-1) === '\t') {
									bioRef.current?.focus();
								} else {
									onChange?.('name', value.replace(/\n/g, ' '));
								}
							}}
							blurOnSubmit
							returnKeyType={'done'}
						/>
					) : (
						<Title style={styles.name}>
							{resolving
								? 'Retrieving\ncontact info...'
								: profileNameMultiLine(name)}
						</Title>
					)}
					<SlashtagURL style={styles.url} url={url} />
				</View>
				{editable && !contact ? (
					<TouchableOpacity
						activeOpacity={0.8}
						style={styles.editImageButton}
						onPress={async (): Promise<void> => {
							const result = await launchImageLibrary({
								mediaType: 'photo',
								includeBase64: true,
								quality: 0.1,
							});
							const base64 = result.assets?.[0].base64;
							const type = result.assets?.[0].type;
							base64 && onChange?.('image', `data:${type};base64,` + base64);
						}}>
						<View style={styles.cameraIconOverlay}>
							<CameraIcon />
						</View>
						<ProfileImage url={url} image={profile?.image} size={96} />
					</TouchableOpacity>
				) : (
					<ProfileImage url={url} image={profile?.image} size={96} />
				)}
			</View>

			{editable && !contact ? (
				<TextInputNoOutline
					ref={bioRef}
					style={styles.bio}
					value={bio}
					placeholder={'Short bio. Tell a bit about yourself.'}
					multiline={true}
					onChangeText={(value): void => onChange?.('bio', value)}
					blurOnSubmit
					returnKeyType={'done'}
				/>
			) : (
				<Text color="gray1" style={styles.bio}>
					{bio}
				</Text>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	text: {
		flex: 1,
	},
	name: {
		fontSize: 34,
		fontFamily: 'NHaasGroteskDSW02-65Md',
	},
	nameFilled: {
		lineHeight: 34,
	},
	url: {
		marginTop: 8,
	},
	bio: {
		fontSize: 22,
		lineHeight: 26,
	},
	editImageButton: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	cameraIconOverlay: {
		position: 'absolute',
		zIndex: 99999,
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default ProfileCard;
