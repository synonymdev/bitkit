import React from 'react';
import { Text, TrashIcon, View } from '../styles/components';
import { BasicProfile } from '../store/types/slashtags';
import { StyleProp, StyleSheet } from 'react-native';
import LabeledInput from './LabeledInput';

const ProfileLinks = ({
	links,
	setLink,
	style = {},
}: {
	links?: BasicProfile['links'];
	setLink?: (title: string, url: string | undefined) => void;
	style?: StyleProp<any> | StyleProp<any>[];
}): JSX.Element => {
	links = links?.filter(({ url }) => url?.length && url.length > 0) || [];

	const editable = setLink;

	const Input = ({
		label,
		deletable,
	}: {
		label: string;
		deletable: boolean;
	}): JSX.Element => {
		return (
			<LabeledInput
				label={label}
				value={links?.filter((l) => l.title === label)[0].url}
				onChange={editable && ((val): void => setLink(label, val))}
				rightIcon={
					editable && deletable ? (
						<TrashIcon color="brand" width={16} />
					) : undefined
				}
				onRightIconPress={editable && ((): void => setLink(label, undefined))}
			/>
		);
	};

	return (
		<View style={StyleSheet.compose(styles.linksViewContainer, style)}>
			{!editable && links?.length === 0 ? (
				<Text style={styles.linksViewNote}>No links added yet...</Text>
			) : (
				links.map(
					(link): JSX.Element => (
						<Input label={link.title} key={link.title} deletable={true} />
					),
				)
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	linksViewContainer: {},
	linksViewNote: {
		opacity: 0.5,
	},
});

export default ProfileLinks;
