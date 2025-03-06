import React, { JSX, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

import { useAppDispatch } from '../hooks/redux';
import { suggestions } from '../screens/Profile/ProfileLinkSuggestions';
import { deleteLink, editLink } from '../store/slices/slashtags';
import { LocalLink } from '../store/types/slashtags';
import { TrashIcon } from '../styles/icons';
import { BodyS, BodySSB, Caption13Up } from '../styles/text';
import { openAppURL } from '../utils/helpers';
import Divider from './Divider';
import LabeledInput from './LabeledInput';

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
								activeOpacity={0.7}
								testID="RemoveLinkButton"
								onPress={(): void => onRemove(link.id)}>
								<TrashIcon color="brand" width={16} />
							</TouchableOpacity>
						</LabeledInput>
					) : (
						<TouchableOpacity
							key={link.id}
							activeOpacity={0.7}
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
