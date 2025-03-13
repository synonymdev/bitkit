import {
	DarkTheme,
	NavigationContainer,
	NavigationContainerProps,
	NavigationContainerRef,
} from '@react-navigation/native';
import React, { forwardRef, ReactElement } from 'react';

const theme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		background: 'transparent',
	},
};

const BottomSheetNavigationContainer = forwardRef<
	NavigationContainerRef<any>,
	NavigationContainerProps
>((props, ref): ReactElement => {
	return <NavigationContainer ref={ref} theme={theme} {...props} />;
});

export default BottomSheetNavigationContainer;
