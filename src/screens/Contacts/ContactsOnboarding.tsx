import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { Display, Text01S, View } from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setOnboardedContacts } from '../../store/actions/slashtags';
import { RootStackParamList } from '../../navigation/types';

type ContactsOnboardingProps = StackScreenProps<RootStackParamList, 'Contacts'>;

export const ContactsOnboarding = ({
	navigation,
}: ContactsOnboardingProps): JSX.Element => {
	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Contacts"
				displayBackButton={false}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<Image
					source={require('../../assets/illustrations/book.png')}
					style={styles.illustration}
				/>
				<View style={styles.text}>
					<Display>Dynamic</Display>
					<Display color="brand">Contacts.</Display>
					<Text01S color="gray1" style={styles.introText}>
						Use Bitkit to get automatic updates from your contacts, pay them,
						and follow their public profiles.
					</Text01S>
				</View>
				<Button
					text="Add Your First Contact"
					size="large"
					onPress={(): void => {
						setOnboardedContacts();
					}}
				/>
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		justifyContent: 'space-between',
		marginHorizontal: 16,
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	illustration: {
		alignSelf: 'center',
		width: 400,
		height: 400,
		maxHeight: '50%',
		resizeMode: 'contain',
	},
	introText: {
		marginTop: 8,
	},
	text: {
		flex: 1,
		backgroundColor: 'transparent',
	},
});

export default ContactsOnboarding;
