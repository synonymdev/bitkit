import React, { useRef } from 'react';
import {
	View,
	TouchableOpacity,
	TextInput,
	StyleSheet,
	Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
	Text,
	Title,
	TextInputNoOutline,
	CameraIcon,
} from '../styles/components';
import ProfileImage from './ProfileImage';
import { SlashtagURL } from './SlashtagURL';
import { BasicProfile } from '../store/types/slashtags';
import { truncate } from '../utils/helpers';

export const MAX_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 160;

export const ProfileCard = ({
	url,
	profile,
	editable,
	contact,
	resolving,
	onChange,
}: {
	url: string;
	profile?: BasicProfile;
	editable?: boolean;
	contact?: boolean;
	resolving: boolean;
	onChange?: (name: string, value: string) => void;
}): JSX.Element => {
	const bioRef = useRef<TextInput | null>(null);

	const name = profile?.name ?? '';
	const bio = profile?.bio;

	// two lines max.
	const nameParts = name.split(/\s+/).slice(0, 2);

	return (
		<>
			<View style={styles.row}>
				<View style={styles.text}>
					{editable && !resolving ? (
						<TextInputNoOutline
							autoFocus={!name}
							// placeholder doesn't like the lineHeight
							style={[styles.nameInput, name && styles.nameInputFilled]}
							value={name?.slice(0, MAX_NAME_LENGTH)}
							placeholder={
								contact ? "Contact's name" : 'Your public\nprofile name'
							}
							multiline={true}
							onChangeText={(value: string): void => {
								if (value.slice(-1) === '\t') {
									bioRef.current?.focus();
								} else {
									onChange?.('name', value.replace(/\n/g, ' '));
								}
							}}
							blurOnSubmit
							returnKeyType="done"
							maxLength={MAX_NAME_LENGTH}
						/>
					) : (
						<View>
							{resolving ? (
								<Title style={styles.name}>
									Retrieving{'\n'}contact info...
								</Title>
							) : (
								nameParts.map((part, index) => (
									<Title key={index} numberOfLines={1} style={styles.name}>
										{truncate(part, 30)}
									</Title>
								))
							)}
						</View>
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
								maxWidth: 1024,
								maxHeight: 1024,
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
					style={styles.bioInput}
					color="gray1"
					value={bio}
					placeholder="Short bio. Tell a bit about yourself."
					multiline={true}
					onChangeText={(value): void => onChange?.('bio', value)}
					blurOnSubmit
					returnKeyType="done"
					maxLength={MAX_BIO_LENGTH}
				/>
			) : (
				<Text color="gray1" style={styles.bio}>
					{bio?.slice(0, MAX_BIO_LENGTH)}
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
		marginBottom: 12,
	},
	text: {
		flex: 1,
		paddingRight: 16,
	},
	name: {
		flexWrap: 'wrap',
		fontSize: 34,
		lineHeight: 34,
		fontFamily: 'NHaasGroteskDSW02-65Md',
	},
	nameInput: {
		flexWrap: 'wrap',
		fontSize: 34,
		fontFamily: 'NHaasGroteskDSW02-65Md',
	},
	nameInputFilled: {
		fontSize: 34,
		lineHeight: 34,
		// needed because of issues with this font on Android
		marginTop: Platform.OS === 'android' ? -12 : -5,
		marginBottom: Platform.OS === 'android' ? -24 : 0,
	},
	url: {
		marginTop: 8,
	},
	bio: {
		fontFamily: 'NHaasGroteskDSW02-55Rg',
		fontSize: 22,
		letterSpacing: 0.4,
		lineHeight: 26,
	},
	bioInput: {
		fontFamily: 'NHaasGroteskDSW02-55Rg',
		fontSize: 22,
		letterSpacing: 0.4,
		lineHeight: 26,
		// needed because of issues with this font on Android
		marginTop: Platform.OS === 'android' ? -8 : 0,
		marginBottom: Platform.OS === 'android' ? -12 : 0,
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
