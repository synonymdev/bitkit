import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import NavigationHeader, {
	NavigationHeaderProps,
} from '../components/NavigationHeader';

type Props = Omit<NavigationHeaderProps, 'size' | 'showCloseButton'> & {
	title: string;
};

const BottomSheetNavigationHeader = (props: Props): ReactElement => (
	<NavigationHeader
		style={styles.container}
		size="sm"
		{...props}
		showCloseButton={false}
	/>
);

const styles = StyleSheet.create({
	container: {
		paddingBottom: 32,
	},
});

export default memo(BottomSheetNavigationHeader);
