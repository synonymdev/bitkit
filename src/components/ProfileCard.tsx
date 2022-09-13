import React, { useRef } from 'react';
import { useEffect } from 'react';
import { TextInput as ITextInput, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Title, TextInput, View, CameraIcon } from '../styles/components';
import { profileNameMultiLine } from '../utils/helpers';
import ProfileImage from './ProfileImage';
import { SlashtagURL } from './SlashtagURL';
import { launchImageLibrary } from 'react-native-image-picker';
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

	const nameRef = useRef<ITextInput | null>(null);
	const bioRef = useRef<ITextInput | null>(null);

	useEffect(() => nameRef.current?.focus(), [resolving]);

	return (
		<View style={styles.container}>
			<View style={styles.row}>
				<View>
					{editable && !resolving ? (
						<TextInput
							ref={nameRef}
							autoFucus={true}
							style={styles.name}
							value={name?.replace(/\s+/g, '\n')}
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
								? 'Retrieving\ncontact info..'
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
				<TextInput
					color="gray1"
					ref={bioRef}
					style={styles.bio}
					value={bio}
					placeholder={'Short bio. Tell a bit about yourself.'}
					onChangeText={(value): void => onChange?.('bio', value)}
					blurOnSubmit
					returnKeyType={'done'}
				/>
			) : (
				<Text color="gray1" style={styles.bio}>
					{bio}
				</Text>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	name: {
		fontSize: 34,
		fontFamily: 'NHaasGroteskDSW02-65Md',
		backgroundColor: 'transparent',
	},
	bio: {
		fontSize: 22,
		lineHeight: 26,
		backgroundColor: 'transparent',
	},
	url: {
		marginTop: 16,
	},
	editImageButton: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	cameraIconOverlay: {
		position: 'absolute',
		zIndex: 99999,
		backgroundColor: 'rgba(0,0,0,.4)',
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default ProfileCard;
