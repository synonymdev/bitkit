import React, { useState, useMemo } from 'react';
import {
	View,
	Image,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';

import { View as ThemedView } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import Button from '../../components/Button';
import { saveContact } from '../../utils/slashtags';
import { useProfile, useSelectedSlashtag } from '../../hooks/slashtags';
import { BasicProfile } from '../../store/types/slashtags';
import Glow from '../../components/Glow';
import { useSlashtags } from '../../components/SlashtagsProvider';
import { RootStackScreenProps } from '../../navigation/types';
import Divider from '../../components/Divider';
import useKeyboard from '../../hooks/keyboard';

const imageSrc = require('../../assets/illustrations/hourglass.png');

export const ContactEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'ContactEdit'>): JSX.Element => {
	const url = route.params.url;
	const saved = useSlashtags().contacts[url];
	const { slashtag } = useSelectedSlashtag();
	const contact = useProfile(url);
	const { keyboardShown } = useKeyboard();

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			// extra padding needed because of KeyboardAvoidingView
			paddingBottom: keyboardShown ? (Platform.OS === 'ios' ? 16 : 40) : 0,
		}),
		[keyboardShown],
	);

	const [form, setForm] = useState<BasicProfile>({ ...saved });

	const profile = useMemo(
		() => ({
			...contact.profile,
			...form,
		}),
		[contact.profile, form],
	);

	const resolving = !saved && contact.resolving;

	const onDiscard = (): void => {
		navigation.navigate('Contacts');
	};

	const onSaveContact = (): void => {
		// To avoid phishing attacks, a name should always be saved in contact record
		slashtag && saveContact(slashtag, url, { name: profile.name });
		navigation.navigate('Contact', { url });
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={`${saved ? 'Edit' : 'Add'} Contact`}
				displayBackButton={resolving}
				onClosePress={(): void => {
					if (saved) {
						navigation.navigate('Contact', { url });
					} else {
						navigation.navigate('Contacts');
					}
				}}
			/>
			<KeyboardAvoidingView behavior="padding" style={styles.content}>
				<ProfileCard
					url={url}
					resolving={resolving}
					profile={profile}
					editable={true}
					contact={true}
					onChange={(_, value): void =>
						setForm((prev) => ({ ...prev, name: value }))
					}
				/>

				{resolving && (
					<View style={styles.imageContainer} pointerEvents="none">
						<Glow color="brand" size={600} style={styles.glow} />
						<Image source={imageSrc} style={styles.image} />
					</View>
				)}

				{!resolving && (
					<>
						<Divider />
						<View style={buttonContainerStyles}>
							<Button
								style={styles.button}
								text="Discard"
								size="large"
								variant="secondary"
								onPress={onDiscard}
							/>
							<View style={styles.divider} />
							<Button
								text="Save"
								size="large"
								style={styles.button}
								disabled={form.name?.length === 0}
								onPress={onSaveContact}
							/>
						</View>
					</>
				)}
			</KeyboardAvoidingView>
			<SafeAreaInsets type="bottom" />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	glow: {
		position: 'absolute',
	},
	image: {
		width: 230,
		height: 230,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default ContactEdit;
