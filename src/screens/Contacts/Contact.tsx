import React, { useCallback } from 'react';
import {
	CoinsIcon,
	PencileIcon,
	ShareIcon,
	TrashIcon,
	View,
} from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import { StyleSheet, Share } from 'react-native';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import ProfileCard from '../../components/ProfileCard';
import { TouchableOpacity } from 'react-native';
import ProfileLinks from '../../components/ProfileLinks';
import { useContact } from '../../hooks/slashtags';
import { deleteContact } from '../../utils/slashtags';
import { useSlashtagsSDK } from '../../components/SlashtagsProvider';

export const Contact = ({ navigation, route }): JSX.Element => {
	const url = route.params?.url;

	const contact = useContact(url);
	const sdk = useSlashtagsSDK();

	const onDelete = useCallback(() => {
		deleteContact(sdk, url);
		navigation.navigate('Tabs');
	}, [navigation, sdk, url]);

	return (
		<View style={styles.container}>
			<SafeAreaInsets type={'top'} />
			<NavigationHeader
				title="Contact"
				displayBackButton={false}
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.content}>
				<ProfileCard
					url={url}
					profile={contact.profile}
					editable={false}
					resolving={false}
				/>
				<View style={styles.divider} />
				<View style={styles.bottom}>
					<View style={styles.bottomHeader}>
						<IconButton
							onPress={(): void => {
								// TODO: do something with payment address
								// eslint-disable-next-line no-alert
								alert(JSON.stringify(contact?.payConfig || {}, null, 2));
							}}>
							<CoinsIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton
							onPress={(): void => {
								Share.share({
									title: 'Share Slashtag url',
									message: url,
								});
							}}>
							<ShareIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton
							onPress={(): void => {
								navigation.navigate('ContactEdit', { url });
							}}>
							<PencileIcon height={24} width={24} color="brand" />
						</IconButton>
						<IconButton onPress={onDelete}>
							<TrashIcon height={24} width={24} color="brand" />
						</IconButton>
					</View>
					<ProfileLinks
						links={contact?.profile?.links}
						style={styles.profileDetails}
					/>
				</View>
			</View>
		</View>
	);
};

const IconButton = ({
	children,
	onPress,
}: {
	children?: any;
	onPress?: () => void;
}): JSX.Element => {
	return (
		<TouchableOpacity
			activeOpacity={0.7}
			onPress={onPress}
			style={styles.iconContainer}>
			{children}
		</TouchableOpacity>
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
	bottom: {
		flex: 1,
		flexDirection: 'column',
	},
	iconContainer: {
		width: 48,
		height: 48,
		borderRadius: 9999,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 16,
	},
	bottomHeader: {
		flexDirection: 'row',
	},
	profileDetails: {
		marginTop: 32,
	},
});

export default Contact;
