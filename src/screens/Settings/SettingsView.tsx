import React, { memo, ReactElement, useMemo, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { View as ThemedView } from '../../styles/components';
import { BodyM, BodyS } from '../../styles/text';
import SearchInput from '../../components/SearchInput';
import List, { IListData } from '../../components/List';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';

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
			<SafeAreaInset type="top" />
			<NavigationHeader title={title} showBackButton={showBackNavigation} />

			{showSearch && (
				<SearchInput
					style={styles.searchInput}
					value={search}
					onChangeText={setSearch}
				/>
			)}

			{headerText && (
				<View style={styles.headerText}>
					<BodyM color="secondary">{headerText}</BodyM>
				</View>
			)}

			{children && childrenPosition === 'top' && (
				<View style={styles.childrenContent}>{children}</View>
			)}

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
					<BodyS color="secondary">{footerText}</BodyS>
				</View>
			)}

			{children && childrenPosition === 'bottom' && (
				<View style={styles.childrenContent}>{children}</View>
			)}

			{fullHeight && <SafeAreaInset type="bottom" minPadding={16} />}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	searchInput: {
		marginVertical: 16,
		marginHorizontal: 16,
	},
	headerText: {
		marginVertical: 16,
		marginHorizontal: 16,
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
	},
	fullHeight: {
		flex: 1,
	},
});

export default memo(SettingsView);
