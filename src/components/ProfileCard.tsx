import React, { ReactElement, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from 'styled-components/native';

import { BasicProfile } from '../store/types/slashtags';
import { TextInputNoOutline } from '../styles/components';
import { CameraIcon } from '../styles/icons';
import { Headline, Text } from '../styles/text';
import { truncate } from '../utils/helpers';
import ProfileImage from './ProfileImage';
import SlashtagURL from './SlashtagURL';

export const MAX_NAME_LENGTH = 50;
export const MAX_BIO_LENGTH = 160;

const ProfileCard = ({
	url,
	resolving,
	profile,
	editable,
	contact,
	autoFocus,
	onChange,
}: {
	url: string;
	resolving: boolean;
	profile?: BasicProfile;
	editable?: boolean;
	contact?: boolean;
	autoFocus?: boolean;
	onChange?: (name: string, value: string) => void;
}): ReactElement => {
	const theme = useTheme();
	const { t } = useTranslation('slashtags');
	const bioRef = useRef<TextInput>(null);

	const name = profile?.name ?? '';
	const bio = profile?.bio;

	return (
		<>
			<View style={styles.row} testID="ProfileCardName">
				<View style={styles.text}>
					{editable && !resolving ? (
						<TextInputNoOutline
							autoFocus={autoFocus || !name}
							// placeholder doesn't like the lineHeight
							style={[
								theme.fonts.black,
								styles.nameInput,
								name ? styles.nameInputFilled : {},
							]}
							value={name?.slice(0, MAX_NAME_LENGTH)}
							placeholder={t(contact ? 'contacts_name' : 'contact_your_name')}
							multiline={true}
							blurOnSubmit
							returnKeyType="done"
							maxLength={MAX_NAME_LENGTH}
							testID="NameInput"
							onChangeText={(value: string): void => {
								if (value.slice(-1) === '\t') {
									bioRef.current?.focus();
								} else {
									onChange?.('name', value.replace(/\n/g, ' '));
								}
							}}
						/>
					) : (
						<View>
							{resolving ? (
								<Headline style={styles.name}>
									{t('contact_retrieving')}
								</Headline>
							) : (
								<Headline style={styles.name} numberOfLines={2}>
									{truncate(name, 30)}
								</Headline>
							)}
						</View>
					)}
					<SlashtagURL style={styles.url} url={url} testID="ProfileSlashtag" />
				</View>

				{editable && !contact ? (
					<TouchableOpacity
						activeOpacity={0.7}
						style={styles.editImageButton}
						onPress={async (): Promise<void> => {
							const result = await launchImageLibrary({
								mediaType: 'photo',
								includeBase64: true,
								maxWidth: 256,
								maxHeight: 256,
							});

							const base64 = result.assets?.[0].base64;
							const type = result.assets?.[0].type;
							base64 && onChange?.('image', `data:${type};base64,${base64}`);
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
					style={[theme.fonts.regular, styles.bioInput]}
					color="secondary"
					value={bio}
					placeholder={t('profile_bio')}
					multiline={true}
					onChangeText={(value): void => onChange?.('bio', value)}
					blurOnSubmit
					returnKeyType="done"
					maxLength={MAX_BIO_LENGTH}
					testID="BioInput"
				/>
			) : (
				<Text color="secondary" style={[theme.fonts.regular, styles.bio]}>
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
	},
	nameInput: {
		flexWrap: 'wrap',
		fontSize: 30,
		lineHeight: 30,
		// textTransform: 'uppercase',
		// needed because of issues with this font on Android
		marginTop: Platform.OS === 'android' ? 10 : 0,
	},
	nameInputFilled: {
		fontSize: 30,
		lineHeight: 30,
		// textTransform: 'uppercase',
	},
	url: {
		marginTop: 8,
	},
	bio: {
		fontSize: 22,
		letterSpacing: 0.4,
		lineHeight: 26,
	},
	bioInput: {
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
