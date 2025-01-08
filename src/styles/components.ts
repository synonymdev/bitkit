import {
	ColorValue,
	Platform,
	PressableProps,
	ScrollViewProps,
	TouchableOpacity as RNTouchableOpacity,
	TouchableHighlight as RNTouchableHighlight,
	TouchableOpacityProps,
	TouchableHighlightProps,
	Pressable as RNPressable,
	ViewProps,
	TextInput as RNTextInput,
	TextInputProps as RNTextInputProps,
} from 'react-native';
import Color from 'color';
import Animated, { AnimatedProps } from 'react-native-reanimated';
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

type ColorProps = {
	color?: keyof IThemeColors;
};

type TextInputProps = RNTextInputProps & {
	backgroundColor?: keyof IThemeColors;
	color?: keyof IThemeColors;
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
		theme: {
			...DefaultTheme,
			colors: {
				...DefaultTheme.colors,
				card: 'transparent',
				text: props.theme.colors.primary,
				background: 'transparent',
				primary: 'transparent',
				border: 'transparent',
			},
		},
	}),
)({});

export const View = styled.View<ViewProps & ColorProps>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const AnimatedView = styled(Animated.View)<
	AnimatedProps<ViewProps> & ColorProps
>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const ScrollView = styled.ScrollView.attrs<ScrollViewProps & ColorProps>(
	(props) => ({
		backgroundColor: props.color
			? props.theme.colors[props.color]
			: props.theme.colors.background,
		keyboardShouldPersistTaps: 'handled',
		...props,
	}),
)<ScrollViewProps & ColorProps>(() => ({}));

export const TouchableOpacity = styled(RNTouchableOpacity).attrs<
	TouchableOpacityProps & ColorProps
>((props) => {
	return { activeOpacity: props.activeOpacity ?? 0.7 };
})<TouchableHighlightProps>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const TouchableHighlight = styled(RNTouchableHighlight).attrs<
	TouchableHighlightProps & ColorProps
>((props) => {
	const backgroundColor = props.theme.colors[props.color];
	// double the opacity for pressed state
	const underlayColor = Color(backgroundColor).opaquer(1).string();
	return { underlayColor };
})<TouchableHighlightProps>((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.transparent,
}));

export const Pressable = styled(RNPressable)<PressableProps & ColorProps>(
	(props) => ({
		backgroundColor: props.color
			? props.theme.colors[props.color]
			: props.theme.colors.background,
		opacity: props.disabled ? 0.5 : 1,
	}),
);

export const TextInput = styled(RNTextInput).attrs<TextInputProps>((props) => ({
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.secondary,
}))<TextInputProps>((props) => ({
	...props.theme.fonts.semiBold,
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.backgroundColor]
		: props.theme.colors.white10,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.primary,
	borderColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.primary,
	borderRadius: 8,
	fontSize: '15px',
	minHeight: props.minHeight ? props.minHeight : 52,
	padding: 16,
	textAlignVertical: props.multiline ? 'top' : 'center',
}));

export const TextInputNoOutline = styled(RNTextInput).attrs<TextInputProps>(
	(props) => ({
		keyboardAppearance: props.theme.id,
		selectionColor: colors.brand,
		placeholderTextColor: props.placeholderTextColor
			? props.placeholderTextColor
			: props.theme.colors.secondary,
	}),
)<TextInputProps>((props) => ({
	...props.theme.fonts.semiBold,
	fontSize: '15px',
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.primary,
	textAlignVertical: props.multiline ? 'top' : 'center',
}));

export const BottomSheetTextInput = styled(
	_BottomSheetTextInput,
).attrs<TextInputProps>((props) => ({
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.secondary,
}))<TextInputProps>((props) => ({
	...props.theme.fonts.semiBold,
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.backgroundColor]
		: props.theme.colors.white06,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.primary,
	borderColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.primary,
	borderRadius: 8,
	fontSize: '15px',
	minHeight: props.minHeight ? props.minHeight : 52,
	padding: 16,
	textAlignVertical: props.multiline ? 'top' : 'center',
}));

export const StatusBar = styled.StatusBar.attrs((props) => ({
	animated: true,
	translucent: true,
	...Platform.select({
		ios: {
			barStyle: props.theme.id === 'light' ? 'dark-content' : 'light-content',
		},
		android: {
			backgroundColor: 'transparent',
			barStyle: 'light-content',
		},
	}),
}))({});
