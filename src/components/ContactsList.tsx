import React, { ReactElement, useCallback, useMemo } from 'react';
import { View, SectionList, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../styles/components';
import { Caption13Up, Text01M } from '../styles/text';
import ProfileImage from './ProfileImage';
import { SlashtagURL } from './SlashtagURL';
import { useProfile, useSelectedSlashtag } from '../hooks/slashtags';
import { IContactRecord } from '../store/types/slashtags';
import { useSlashtags } from './SlashtagsProvider';
import Divider from './Divider';
import { BottomSheetSectionList } from '@gorhom/bottom-sheet';
import { truncate } from '../utils/helpers';
import { IThemeColors } from '../styles/themes';

export const ContactItem = ({
	contact,
	size,
	onPress,
}: {
	contact: IContactRecord;
	size?: 'small' | 'normal';
	onPress?: (contact: IContactRecord) => void;
}): JSX.Element => {
	const { t } = useTranslation('slashtags');
	const { url: myProfileURL } = useSelectedSlashtag();
	const { profile } = useProfile(contact.url);

	const name = useMemo(() => {
		const fallbackName =
			contact.url === myProfileURL ? t('your_name_capital') : t('contact_name');
		return truncate(profile?.name || contact?.name || fallbackName, 30);
	}, [contact, profile?.name, myProfileURL, t]);

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={(): void => {
				onPress?.(contact);
			}}>
			{size !== 'small' && <Divider />}
			<View style={cstyles.container}>
				<ProfileImage
					url={contact.url}
					image={profile?.image}
					size={size === 'small' ? 32 : 48}
				/>
				<View style={cstyles.column} pointerEvents="none">
					<Text01M
						numberOfLines={1}
						style={size !== 'small' ? cstyles.name : undefined}>
						{name}
					</Text01M>
					<SlashtagURL url={contact.url} color="gray1" bold={false} />
				</View>
			</View>
		</TouchableOpacity>
	);
};

const Empty = (): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<View style={estyles.empty}>
			<Text01M>{t('contacts_no_found')}</Text01M>
		</View>
	);
};

const ContactsList = ({
	onPress,
	searchFilter = '',
	includeMyProfile = false,
	sectionBackgroundColor = 'black',
	stickySectionHeadersEnabled,
	bottomSheet = false,
}: {
	onPress: (contact: IContactRecord) => void;
	searchFilter?: string;
	includeMyProfile?: boolean;
	sectionBackgroundColor?: keyof IThemeColors;
	stickySectionHeadersEnabled?: boolean;
	bottomSheet?: boolean;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const contacts = useSlashtags().contacts as { [url: string]: IContactRecord };
	const { url: myProfileURL } = useSelectedSlashtag();

	const filteredContacts = useMemo(() => {
		return Object.values(contacts)
			.sort((a, b) => (a.name > b.name ? 1 : -1))
			.filter(
				({ name, url }) =>
					url.toLowerCase().includes(searchFilter.toLowerCase()) ||
					name?.toLowerCase().includes(searchFilter.toLowerCase()),
			);
	}, [contacts, searchFilter]);

	const sectionedContacts = useMemo(() => {
		const sections: { [char: string]: IContactRecord[] } = {};

		filteredContacts.forEach((contact) => {
			const name = contact?.name ?? 'Contact Name';
			const char = name.slice(0, 1);
			if (char) {
				sections[char]
					? sections[char].push(contact)
					: (sections[char] = [contact]);
			}
		});

		const result = Object.entries(sections).map(([title, data]) => ({
			title,
			data,
		}));

		if (includeMyProfile && searchFilter.length === 0) {
			result.unshift({
				title: t('my_profile'),
				data: [{ url: myProfileURL as string } as IContactRecord],
			});
		}

		return result;
	}, [filteredContacts, myProfileURL, includeMyProfile, searchFilter, t]);

	const List = bottomSheet ? BottomSheetSectionList : SectionList;

	const renderSectionHeader = useCallback(
		// eslint-disable-next-line react/no-unused-prop-types
		({ section: { title } }: { section: { title: string } }): ReactElement => {
			const isFirst = title === sectionedContacts[0].title;
			return (
				<ThemedView
					color={sectionBackgroundColor}
					style={!isFirst && styles.sectionSpacing}>
					<Caption13Up color="gray1">{title}</Caption13Up>
				</ThemedView>
			);
		},
		[sectionBackgroundColor, sectionedContacts],
	);

	const renderItem = useCallback(
		// eslint-disable-next-line react/no-unused-prop-types
		({ item }: { item: IContactRecord }): ReactElement => (
			<ContactItem contact={item} onPress={onPress} />
		),
		[onPress],
	);

	return (
		<List
			sections={sectionedContacts}
			keyExtractor={(item: IContactRecord): string => item.url}
			ListEmptyComponent={Empty}
			renderSectionHeader={renderSectionHeader}
			renderItem={renderItem}
			stickySectionHeadersEnabled={stickySectionHeadersEnabled}
		/>
	);
};

const cstyles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
		marginBottom: 10,
	},
	column: {
		marginLeft: 16,
	},
	name: {
		marginBottom: 4,
	},
});

const estyles = StyleSheet.create({
	empty: {
		alignSelf: 'center',
		marginTop: '50%',
	},
});

const styles = StyleSheet.create({
	sectionSpacing: {
		height: 60,
		justifyContent: 'flex-end',
		paddingBottom: 2,
	},
});

export default ContactsList;
