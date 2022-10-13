import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import NavigationHeader, {
	NavigationHeaderProps,
} from '../components/NavigationHeader';

type Props = Omit<NavigationHeaderProps, 'size'> & { title: string };

const BottomSheetNavigationHeader = (props: Props): ReactElement => (
	<NavigationHeader size="sm" style={styles.container} {...props} />
);

const styles = StyleSheet.create({
	container: {
		paddingBottom: 32,
	},
});

export default memo(BottomSheetNavigationHeader);
