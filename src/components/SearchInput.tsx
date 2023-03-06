import React, { ReactElement, memo } from 'react';
import {
	StyleProp,
	StyleSheet,
	TextInputProps,
	View,
	ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { TextInput } from '../styles/components';
import { MagnifyingGlassIcon } from '../styles/icons';

type SearchInputProps = TextInputProps & {
	style?: StyleProp<ViewStyle>;
};

const SearchInput = ({
	style,
	children,
	...props
}: SearchInputProps): ReactElement => {
	const { t } = useTranslation('search');

	return (
		<View style={[styles.root, style]}>
			<MagnifyingGlassIcon style={styles.icon} />
			{/* @ts-ignore react-native and styled-components types clashing */}
			<TextInput style={styles.input} placeholder={t('search')} {...props} />
			{children && <View style={styles.tags}>{children}</View>}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 32,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		height: 48,
		overflow: 'hidden',
	},
	input: {
		fontSize: 17,
		fontWeight: '400',
		flex: 1,
		backgroundColor: 'transparent',
		paddingLeft: 0,
	},
	icon: {
		marginHorizontal: 16,
	},
	tags: {
		maxWidth: '60%',
	},
});

export default memo(SearchInput);
