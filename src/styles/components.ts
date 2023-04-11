import { ColorValue, Platform, Switch as RNSwitch } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetTextInput as _BottomSheetTextInput } from '@gorhom/bottom-sheet';
import {
	DefaultTheme,
	NavigationContainer as _NavigationContainer,
} from '@react-navigation/native';

import _SafeAreaView from '../components/SafeAreaView';
import styled from './styled-components';
import colors from './colors';
import { IThemeColors } from './themes';

type ComponentProps = {
	color?: keyof IThemeColors;
};

type TextInputProps = ComponentProps & {
	backgroundColor?: keyof IThemeColors;
	minHeight?: number;
	placeholderTextColor?: ColorValue;
};

export const SafeAreaProvider = styled(_SafeAreaProvider)`
	flex: 1;
	background-color: ${(props): string => props.theme.colors.background};
`;

export const SafeAreaView = styled(_SafeAreaView)`
	flex: 1;
	background-color: ${(props): string => props.theme.colors.background};
`;

export const Container = styled.View`
	flex: 1;
	background-color: ${(props): string => props.theme.colors.background};
`;

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

export const View = styled.View<ComponentProps>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const AnimatedView = styled(Animated.View)<ComponentProps>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const ScrollView = styled.ScrollView<ComponentProps>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const TouchableOpacity = styled.TouchableOpacity<ComponentProps>(
	(props) => ({
		backgroundColor: props.color
			? props.theme.colors[props.color]
			: props.theme.colors.background,
	}),
);

export const Pressable = styled.Pressable<ComponentProps>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
	opacity: props.disabled ? 0.4 : 1,
}));

export const Switch = styled(RNSwitch).attrs((props) => ({
	trackColor: { false: '#767577', true: props.theme.colors.brand },
	thumbColor: 'white',
	ios_backgroundColor: '#3e3e3e',
	...props,
}))({});

export const TextInput = styled.TextInput.attrs<TextInputProps>((props) => ({
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.gray1,
}))<TextInputProps>((props) => ({
	...props.theme.fonts.medium,
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.backgroundColor]
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
	textAlignVertical: props.multiline ? 'top' : 'center',
}));

export const TextInputNoOutline = styled.TextInput.attrs<TextInputProps>(
	(props) => ({
		keyboardAppearance: props.theme.id,
		selectionColor: colors.brand,
		placeholderTextColor: props.placeholderTextColor
			? props.placeholderTextColor
			: props.theme.colors.gray1,
	}),
)<TextInputProps>((props) => ({
	...props.theme.fonts.medium,
	fontSize: '15px',
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	textAlignVertical: props.multiline ? 'top' : 'center',
}));

export const BottomSheetTextInput = styled(
	_BottomSheetTextInput,
).attrs<TextInputProps>((props) => ({
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.white5,
}))<TextInputProps>((props) => ({
	...props.theme.fonts.medium,
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
	minHeight: props.minHeight ? props.minHeight : 52,
	padding: 16,
	textAlignVertical: props.multiline ? 'top' : 'center',
}));

export const RefreshControl = styled.RefreshControl.attrs((props) => ({
	tintColor: props.theme.colors.refreshControl,
}))({});

export const StatusBar = styled.StatusBar.attrs((props) => ({
	animated: true,
	...Platform.select({
		ios: {
			barStyle: props.theme.id === 'light' ? 'dark-content' : 'light-content',
		},
		android: {
			backgroundColor: 'black',
			barStyle: 'light-content',
		},
	}),
}))({});
