import React, { useState, useMemo, useEffect } from 'react';
import { View } from '../../styles/components';
import { Image } from 'react-native';
import NavigationHeader from '../../components/NavigationHeader';
import { StyleSheet } from 'react-native';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import Button from '../../components/Button';
import { saveContact } from '../../utils/slashtags';
import { useContact, useSelectedSlashtag } from '../../hooks/slashtags';
import { BasicProfile } from '../../store/types/slashtags';
import Glow from '../../components/Glow';

export const ContactEdit = ({ navigation, route }): JSX.Element => {
	const url = route.params.url;
	const [form, setForm] = useState<BasicProfile>({});

	const { slashtag } = useSelectedSlashtag();

	const remote = useContact(url);

	// Reset the name once the remote is resolved for adding a new contact
	useEffect(() => {
		!remote.isContact &&
			remote.profile?.name &&
			setForm({ name: remote.profile.name });
	}, [remote.profile, remote.isContact]);

	const profile = useMemo(
		() => ({
			...remote?.profile,
			...form,
		}),
		[remote.profile, form],
	);

	const saveContactRecord = async (): Promise<void> => {
		slashtag && saveContact(slashtag, url, form);
		navigation.navigate('Contact', { url });
	};

	return (
		<View style={styles.container}>
			<SafeAreaInsets type={'top'} />
			<NavigationHeader
				title={(remote.isContact ? 'Edit' : 'Add') + ' Contact'}
				displayBackButton={false}
				onClosePress={(): void => {
					navigation.navigate(remote.isContact ? 'Contact' : 'Contacts', {
						url,
					});
				}}
			/>
			<View style={styles.content}>
				<ProfileCard
					url={url}
					resolving={!remote.resolved}
					profile={profile}
					editable={true}
					contact={true}
					onChange={(_, value): void =>
						setForm((prev) => ({ ...prev, name: value }))
					}
				/>
				{remote.resolved && <View style={styles.divider} />}
				<View style={styles.middleRow}>
					{!remote.resolved && (
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
			</View>
		</View>
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
		height: 2,
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
		backgroundColor: 'transparent',
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
