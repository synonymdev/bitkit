import React, { ReactElement, memo } from 'react';
import {
	StyleProp,
	StyleSheet,
	Platform,
	TextInputProps,
	View,
	ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { TextInput, View as ThemedView } from '../styles/components';
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
		<ThemedView style={[styles.root, style]} color="white10">
			<MagnifyingGlassIcon
				style={styles.icon}
				color={props.value ? 'brand' : 'secondary'}
			/>
			<TextInput style={styles.input} placeholder={t('search')} {...props} />
			{children && <View style={styles.tags}>{children}</View>}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 32,
		height: 48,
		overflow: 'hidden',
	},
	input: {
		fontSize: 17,
		fontWeight: '400',
		letterSpacing: 0.4,
		flex: 1,
		backgroundColor: 'transparent',
		paddingLeft: 0,
		...Platform.select({
			android: {
				fontFamily: 'Inter-Regular',
			},
		}),
	},
	icon: {
		marginHorizontal: 16,
	},
	tags: {
		maxWidth: '60%',
	},
});

export default memo(SearchInput);
