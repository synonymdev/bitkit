import React, { useState, useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';

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

export const ContactEdit = ({ navigation, route }): JSX.Element => {
	const url = route.params.url;
	const saved = useSlashtags().contacts[url];

	const [form, setForm] = useState<BasicProfile>({ ...saved });

	const { slashtag } = useSelectedSlashtag();

	const contact = useProfile(url);

	const profile = useMemo(
		() => ({
			...contact.profile,
			...form,
		}),
		[contact.profile, form],
	);

	const resolving = !saved && contact.resolving;

	const saveContactRecord = async (): Promise<void> => {
		// To avoid phishing attacks, a name should always be saved in contact record
		slashtag && saveContact(slashtag, url, { name: profile.name });
		navigation.navigate('Contact', { url });
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={(saved ? 'Edit' : 'Add') + ' Contact'}
				displayBackButton={false}
				onClosePress={(): void => {
					navigation.navigate(saved ? 'Contact' : 'Contacts', {
						url,
					});
				}}
			/>
			<View style={styles.content}>
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
				{!resolving && <View style={styles.divider} />}
				<View style={styles.middleRow}>
					{resolving && (
						<View>
							<Glow color="brand" size={600} style={styles.illustrationGlow} />
							<Image
								source={require('../../assets/illustrations/hourglass.png')}
								style={styles.illustration}
							/>
						</View>
					)}
				</View>
				<View style={styles.bottomRow}>
					<Button
						style={styles.buttonLeft}
						text="Discard"
						size="large"
						variant="secondary"
						onPress={(): void => navigation.navigate('Tabs')}
					/>
					<Button
						text="Save"
						size="large"
						style={styles.buttonRight}
						disabled={form.name?.length === 0}
						onPress={saveContactRecord}
					/>
				</View>
				<SafeAreaInsets type="bottom" />
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		margin: 20,
		marginTop: 0,
		backgroundColor: 'transparent',
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginTop: 16,
		marginBottom: 16,
	},
	middleRow: {
		flex: 1,
	},
	bottomRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	buttonLeft: {
		flex: 1,
		marginRight: 16,
	},
	buttonRight: {
		flex: 1,
	},
	illustration: {
		alignSelf: 'center',
		width: 332,
		height: 332,
	},
	illustrationGlow: {
		position: 'absolute',
		left: -120,
		top: -120,
	},
});

export default ContactEdit;
