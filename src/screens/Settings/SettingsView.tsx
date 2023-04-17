import React, { memo, ReactElement, useMemo, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { View as ThemedView } from '../../styles/components';
import { Text01S, Text02S } from '../../styles/text';
import SearchInput from '../../components/SearchInput';
import List, { IListData } from '../../components/List';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import { SettingsScreenProps } from '../../navigation/types';
import { SettingsStackParamList } from '../../navigation/settings/SettingsNavigator';

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
	style,
}: {
	title?: string;
	listData?: IListData[];
	headerText?: string;
	footerText?: string;
	showBackNavigation?: boolean;
	showSearch?: boolean;
	fullHeight?: boolean;
	children?: ReactElement | ReactElement[];
	childrenPosition?: 'top' | 'bottom';
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const navigation =
		useNavigation<
			SettingsScreenProps<keyof SettingsStackParamList>['navigation']
		>();

	const [search, setSearch] = useState('');
	const filteredListData = useMemo(() => {
		return (
			listData?.map((section) => {
				const filteredSectionData = section.data.filter((item) => {
					return item.title.toLowerCase().includes(search.toLowerCase());
				});

				const filteredSection = filteredSectionData.length > 0 ? section : null;

				return { ...filteredSection, data: filteredSectionData };
			}) ?? []
		);
	}, [listData, search]);

	return (
		<ThemedView
			style={[fullHeight && styles.fullHeight, style]}
			color={fullHeight ? 'black' : 'transparent'}>
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

			{children && childrenPosition === 'top' && <View>{children}</View>}

			{listData && (
				<View
					style={[
						styles.listContent,
						fullHeight && styles.listContentFullHeight,
					]}>
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
				<View style={styles.childrenContent}>{children}</View>
			)}

			<SafeAreaInsets type="bottom" />
		</ThemedView>
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
		flex: 2,
		borderColor: 'blue',
		borderWidth: 1,
	},
	fullHeight: {
		flex: 1,
	},
});

export default memo(SettingsView);
