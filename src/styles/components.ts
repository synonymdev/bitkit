import { Platform, Switch as _Switch } from 'react-native';
import styled from 'styled-components/native';
import Animated from 'react-native-reanimated';
import { sanFranciscoWeights } from 'react-native-typography';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetTextInput as _BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
	DefaultTheme,
	NavigationContainer as _NavigationContainer,
} from '@react-navigation/native';

import colors from './colors';
import _SafeAreaView from '../components/SafeAreaView';

export const SafeAreaProvider = styled(_SafeAreaProvider)`
	flex: 1;
	background-color: ${(props): string => props.theme.colors.background};
`;

export const SafeAreaView = styled(_SafeAreaView)`
	flex: 1;
	background-color: ${(props): string => props.theme.colors.background};
`;

export const Container = styled.View((props) => ({
	flex: 1,
	backgroundColor: props.theme.colors.background,
}));

export const NavigationContainer = styled(_NavigationContainer).attrs(
	(props) => ({
		independent: true,
		theme: {
			...DefaultTheme,
			colors: {
				...DefaultTheme.colors,
				card: 'transparent',
				text: props.theme.colors.text,
				background: 'transparent',
				primary: 'transparent',
				border: 'transparent',
			},
		},
	}),
)({});

export const View = styled.View((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const AnimatedView = styled(Animated.View)((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const TouchableOpacity = styled.TouchableOpacity((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const Pressable = styled.Pressable((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
	opacity: props.disabled ? 0.4 : 1,
}));

export const ScrollView = styled.ScrollView((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const TextInput = styled.TextInput.attrs((props) => ({
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props?.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.gray1,
}))((props) => ({
	...sanFranciscoWeights.semibold,
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.color]
		: props.theme.colors.white08,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderRadius: 8,
	fontSize: '15px',
	minHeight: props.minHeight ? props.minHeight : 52,
	padding: 16,
}));

export const TextInputNoOutline = styled.TextInput.attrs((props) => ({
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props?.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.gray1,
}))((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontSize: '15px',
}));

export const BottomSheetTextInput = styled(_BottomSheetTextInput).attrs(
	(props) => ({
		keyboardAppearance: props.theme.id,
		selectionColor: colors.brand,
		placeholderTextColor: props?.placeholderTextColor
			? props.placeholderTextColor
			: props.theme.colors.white5,
	}),
)((props) => ({
	...sanFranciscoWeights.semibold,
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.backgroundColor]
		: props.theme.colors.white04,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderRadius: 8,
	fontSize: '15px',
	minHeight: props.minHeight ? props.minHeight : 70,
	padding: 16,
}));

export const RefreshControl = styled.RefreshControl.attrs((props) => ({
	tintColor: props.theme.colors.refreshControl,
}))({});

export const StatusBar = styled.StatusBar.attrs((props) => ({
	animated: true,
	barStyle:
		Platform.OS === 'android'
			? 'light-content'
			: props.theme.id === 'light'
			? 'dark-content'
			: 'light-content',
}))({});

export const Switch = styled(_Switch).attrs((props) => ({
	trackColor: { false: '#767577', true: props.theme.colors.brand },
	thumbColor: 'white',
	ios_backgroundColor: '#3e3e3e',
	...props,
}))({});
