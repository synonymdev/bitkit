import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';

import Button from '../../components/Button';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { ProfileLinkScreenProps } from '../../navigation/types';
import { updateProfileLink } from '../../store/actions/ui';
import GradientView from '../../components/GradientView';

const suggestions = [
	'Email',
	'Phone',
	'Website',
	'Twitter',
	'Telegram',
	'Instagram',
	'Facebook',
	'LinkedIn',
	'Github',
	'Calendly',
	'Vimeo',
	'YouTube',
	'Twitch',
	'Pinterest',
	'TikTok',
	'Spotify',
];

export const ProfileLinkSuggestions = ({
	navigation,
}: ProfileLinkScreenProps<'ProfileLinkSuggestions'>): ReactElement => {
	const handleChoose = (suggestion: string): void => {
		updateProfileLink({ title: suggestion });
		navigation.goBack();
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Suggestions To Add" />
			<View style={styles.buttons}>
				{suggestions.map((suggestion) => (
					<Button
						key={suggestion}
						text={suggestion}
						style={styles.button}
						color="white32"
						onPress={(): void => handleChoose(suggestion)}
					/>
				))}
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	buttons: {
		paddingHorizontal: 16,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	button: {
		marginRight: 8,
		marginTop: 8,
		minWidth: 50,
	},
});

export default ProfileLinkSuggestions;
