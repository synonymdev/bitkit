import React, { ReactElement } from 'react';
import {
	View,
	TouchableOpacity,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Caption13Up, BodySSB, BodyS } from '../styles/text';
import { TrashIcon } from '../styles/icons';
import { LocalLink } from '../store/types/slashtags';
import { useAppDispatch } from '../hooks/redux';
import { editLink, deleteLink } from '../store/slices/slashtags';
import LabeledInput from './LabeledInput';
import Divider from './Divider';
import { suggestions } from '../screens/Profile/ProfileLinkSuggestions';
import { openAppURL } from '../utils/helpers';

const trimLink = (link: LocalLink): string => {
	let trimmedUrl = link.url;
	const suggestion = suggestions.find((s) => s.title === link.title);
	const AtPrefixed = ['TikTok', 'Twitter', 'YouTube'];

	if (suggestion) {
		if (AtPrefixed.includes(link.title)) {
			trimmedUrl = trimmedUrl.replace(suggestion.prefix, '@');
		} else {
			trimmedUrl = trimmedUrl.replace(suggestion.prefix, '');
		}
	}

	return trimmedUrl.replace('https://', '').replace('www.', '');
};

const ProfileLinks = ({
	links,
	editable = false,
	style,
	linksText = true,
}: {
	links: LocalLink[];
	editable?: boolean;
	style?: StyleProp<ViewStyle>;
	linksText?: boolean;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const dispatch = useAppDispatch();

	const onChange = (link: LocalLink): void => {
		dispatch(editLink(link));
	};

	const onRemove = (id: LocalLink['id']): void => {
		dispatch(deleteLink(id));
	};

	return (
		<View style={style}>
			{!editable && links?.length === 0 && linksText ? (
				<>
					<BodyS color="secondary">{t('contact_no_links')}</BodyS>
					<Divider />
				</>
			) : (
				links.map((link): JSX.Element => {
					const trimmedUrl = trimLink(link);

					return editable ? (
						<LabeledInput
							key={link.id}
							style={styles.input}
							label={link.title}
							value={link.url}
							onChange={(value: string): void => {
								onChange({ ...link, url: value });
							}}>
							<TouchableOpacity
								testID="RemoveLinkButton"
								onPress={(): void => onRemove(link.id)}>
								<TrashIcon color="brand" width={16} />
							</TouchableOpacity>
						</LabeledInput>
					) : (
						<TouchableOpacity
							key={link.id}
							onPress={(): void => {
								openAppURL(link.url);
							}}>
							<Caption13Up style={styles.label} color="secondary">
								{link.title}
							</Caption13Up>
							<BodySSB numberOfLines={1}>{trimmedUrl}</BodySSB>
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
	input: {
		marginBottom: 16,
	},
});

export default ProfileLinks;
