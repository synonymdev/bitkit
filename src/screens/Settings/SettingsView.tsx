import React, { memo, ReactElement, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { Text01S, Text02S, View } from '../../styles/components';
import SearchInput from '../../components/SearchInput';
import List, { IListData } from '../../components/List';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { SettingsScreenProps } from '../../navigation/types';
import { SettingsStackParamList } from '../../navigation/settings/SettingsNavigator';

/**
 * Generic settings view
 * @param title
 * @param data
 * @param showBackNavigation
 * @returns {JSX.Element}
 * @constructor
 */
const SettingsView = ({
	title = ' ',
	listData,
	headerText,
	footerText,
	showBackNavigation = true,
	showSearch = false,
	fullHeight = true,
	children,
	childrenPosition = 'top',
}: {
	title?: string;
	listData?: IListData[];
	headerText?: string;
	footerText?: string;
	showBackNavigation: boolean;
	showSearch?: boolean;
	fullHeight?: boolean;
	children?: ReactElement | ReactElement[] | undefined;
	childrenPosition?: 'top' | 'bottom';
}): ReactElement => {
	const navigation =
		useNavigation<
			SettingsScreenProps<keyof SettingsStackParamList>['navigation']
		>();

	const [search, setSearch] = useState('');
	const filteredListData = useMemo(
		() =>
			listData?.map((section) => {
				const filteredSectionData = section.data.filter((item) => {
					return item.title.toLowerCase().includes(search.toLowerCase());
				});

				const filteredSection = filteredSectionData.length > 0 ? section : null;

				return { ...filteredSection, data: filteredSectionData };
			}) ?? [],
		[listData, search],
	);

	return (
		<View style={fullHeight && styles.fullHeight} color="black">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title={title}
				displayBackButton={showBackNavigation}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>

			{showSearch && (
				<SearchInput
					style={styles.searchInput}
					value={search}
					onChangeText={setSearch}
				/>
			)}

			{headerText && (
				<View style={styles.headerText}>
					<Text01S color="gray1">{headerText}</Text01S>
				</View>
			)}

			{children && childrenPosition === 'top' && (
				<View color="black">{children}</View>
			)}

			{listData && (
				<View
					style={[
						styles.listContent,
						fullHeight && styles.listContentFullHeight,
					]}
					color="black">
					<List
						style={fullHeight && styles.listFullHeight}
						data={filteredListData}
						bounces={!!fullHeight}
					/>
				</View>
			)}

			{footerText && (
				<View style={styles.footerText}>
					<Text02S color="gray1">{footerText}</Text02S>
				</View>
			)}

			{children && childrenPosition === 'bottom' && (
				<View style={styles.childrenContent} color="black">
					{children}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	searchInput: {
		marginHorizontal: 16,
		marginBottom: 16,
	},
	headerText: {
		marginHorizontal: 16,
		marginBottom: 27,
	},
	footerText: {
		marginVertical: 16,
		marginHorizontal: 16,
	},
	listContent: {
		paddingHorizontal: 16,
	},
	listContentFullHeight: {
		flex: 1,
	},
	listFullHeight: {
		paddingBottom: 55,
	},
	childrenContent: {
		flex: 1,
	},
	fullHeight: {
		flex: 1,
	},
});

export default memo(SettingsView);
