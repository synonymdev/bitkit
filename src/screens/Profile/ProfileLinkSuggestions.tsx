import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import GradientView from '../../components/GradientView';
import Button from '../../components/buttons/Button';
import { useAppDispatch } from '../../hooks/redux';
import type { ProfileLinkScreenProps } from '../../navigation/types';
import { updateProfileLink } from '../../store/slices/ui';
import { TProfileLink } from '../../store/types/ui';

type TSuggestion = {
	prefix: string;
	title: TProfileLink['title'];
};

export const suggestions: TSuggestion[] = [
	{ prefix: 'mailto:', title: 'Email' },
	{ prefix: 'tel:', title: 'Phone' },
	{ prefix: 'https://', title: 'Website' },
	{ prefix: 'https://twitter.com/', title: 'Twitter' },
	{ prefix: 'https://t.me/', title: 'Telegram' },
	{ prefix: 'https://discord.gg/', title: 'Discord' },
	{ prefix: 'https://instagram.com/', title: 'Instagram' },
	{ prefix: 'https://facebook.com/', title: 'Facebook' },
	{ prefix: 'https://linkedin.com/in/', title: 'LinkedIn' },
	{ prefix: 'https://github.com/', title: 'GitHub' },
	{ prefix: 'https://calendly.com/', title: 'Calendly' },
	{ prefix: 'https://vimeo.com/', title: 'Vimeo' },
	{ prefix: 'https://youtube.com/@', title: 'YouTube' },
	{ prefix: 'https://twitch.tv/', title: 'Twitch' },
	{ prefix: 'https://pinterest.com/', title: 'Pinterest' },
	{ prefix: 'https://tiktok.com/@', title: 'TikTok' },
	{ prefix: 'https://open.spotify.com/user/', title: 'Spotify' },
];

const ProfileLinkSuggestions = ({
	navigation,
}: ProfileLinkScreenProps<'ProfileLinkSuggestions'>): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();

	const handleChoose = (suggestion: TSuggestion): void => {
		dispatch(
			updateProfileLink({ title: suggestion.title, url: suggestion.prefix }),
		);
		navigation.goBack();
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('profile_link_suggestions_to_add')}
			/>
			<View style={styles.buttons}>
				{suggestions.map((suggestion) => (
					<Button
						key={suggestion.title}
						style={styles.button}
						text={suggestion.title}
						color="white16"
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

export default memo(ProfileLinkSuggestions);
