import React from 'react';
import {
	View,
	TouchableOpacity,
	StyleProp,
	StyleSheet,
	ViewStyle,
	Linking,
} from 'react-native';
import { Caption13Up, Text02S, TrashIcon } from '../styles/components';
import { BasicProfile } from '../store/types/slashtags';
import LabeledInput from './LabeledInput';

const ProfileLinks = ({
	links,
	style = {},
	setLink,
}: {
	links?: BasicProfile['links'];
	style?: StyleProp<ViewStyle>;
	setLink?: (title: string, url: string | undefined) => void;
}): JSX.Element => {
	links = links?.filter(({ url }) => url?.length > 0) ?? [];

	const editable = setLink;

	const openLink = async (url: string): Promise<void> => {
		try {
			const canOpen = await Linking.canOpenURL(url);
			if (canOpen) {
				await Linking.openURL(url);
			}
		} catch (err) {
			console.log('Cannot open url: ', url);
		}
	};

	return (
		<View style={style}>
			{!editable && links?.length === 0 ? (
				<Text02S color="gray1">No links added yet...</Text02S>
			) : (
				links.map((link): JSX.Element => {
					const trimmedUrl = link.url
						.replace('https://www.', '')
						.replace('twitter.com/', '@');

					return editable ? (
						<LabeledInput
							key={link.title}
							style={styles.input}
							label={link.title}
							value={links?.filter((l) => l.title === link.title)[0].url}
							onChange={(val): void => setLink(link.title, val)}>
							<TouchableOpacity
								onPress={(): void => {
									setLink(link.title, undefined);
								}}>
								<TrashIcon color="brand" width={16} />
							</TouchableOpacity>
						</LabeledInput>
					) : (
						<TouchableOpacity
							key={link.title}
							onPress={(): void => {
								openLink(link.url);
							}}>
							<Caption13Up color="gray1" style={styles.label}>
								{link.title}
							</Caption13Up>
							<Text02S style={styles.url}>{trimmedUrl}</Text02S>
							<View style={styles.divider} />
						</TouchableOpacity>
					);
				})
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	label: {
		marginBottom: 8,
	},
	url: {
		lineHeight: 15,
	},
	input: {
		marginBottom: 16,
	},
	divider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		marginTop: 16,
		marginBottom: 16,
	},
});

export default ProfileLinks;
