import React from 'react';
import {
	View,
	TouchableOpacity,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';

import { Caption13Up, Text02M, Text02S, TrashIcon } from '../styles/components';
import { LocalLink } from '../store/types/slashtags';
import { openURL } from '../utils/helpers';
import { editLink, removeLink } from '../store/actions/slashtags';
import LabeledInput from './LabeledInput';
import Divider from './Divider';

const ProfileLinks = ({
	links,
	editable = false,
	style,
}: {
	links: LocalLink[];
	editable?: boolean;
	style?: StyleProp<ViewStyle>;
}): JSX.Element => {
	return (
		<View style={style}>
			{!editable && links?.length === 0 ? (
				<Text02S color="gray1">No links added yet...</Text02S>
			) : (
				links.map((link): JSX.Element => {
					const trimmedUrl = link.url
						.replace('https://', '')
						.replace('www.', '')
						.replace('twitter.com/', '@');

					return editable ? (
						<LabeledInput
							key={link.id}
							style={styles.input}
							label={link.title}
							value={link.url}
							onChange={(value: string): void => {
								editLink({
									id: link.id,
									title: link.title,
									url: value,
								});
							}}>
							<TouchableOpacity
								onPress={(): void => {
									removeLink(link.id);
								}}>
								<TrashIcon color="brand" width={16} />
							</TouchableOpacity>
						</LabeledInput>
					) : (
						<TouchableOpacity
							key={link.id}
							onPress={(): void => {
								openURL(link.url);
							}}>
							<Caption13Up color="gray1" style={styles.label}>
								{link.title}
							</Caption13Up>
							<Text02M numberOfLines={1} style={styles.url}>
								{trimmedUrl}
							</Text02M>
							<Divider />
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
});

export default ProfileLinks;
