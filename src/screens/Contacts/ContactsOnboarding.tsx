import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';

import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { Display, Text01S } from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { setOnboardedContacts } from '../../store/actions/slashtags';
import { RootStackParamList } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/book.png');

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
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content}>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View style={styles.text}>
					<Display>Dynamic</Display>
					<Display color="brand">Contacts.</Display>
					<Text01S color="gray1" style={styles.introText}>
						Use Bitkit to get automatic updates from your contacts, pay them,
						and follow their public profiles.
					</Text01S>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text="Add Your First Contact"
						size="large"
						onPress={(): void => {
							setOnboardedContacts();
						}}
					/>
				</View>
			</View>
			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		marginHorizontal: 16,
		paddingBottom: 16,
	},
	imageContainer: {
		flex: 1,
		alignItems: 'center',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	introText: {
		marginTop: 8,
	},
	text: {
		flex: 1,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default ContactsOnboarding;
