import { BottomSheetTextInput as _BottomSheetTextInput } from '@gorhom/bottom-sheet';
import Color from 'color';
import {
	ColorValue,
	Platform,
	PressableProps,
	Pressable as RNPressable,
	TextInput as RNTextInput,
	TextInputProps as RNTextInputProps,
	TouchableHighlight as RNTouchableHighlight,
	TouchableOpacity as RNTouchableOpacity,
	ScrollViewProps,
	TouchableHighlightProps,
	TouchableOpacityProps,
	ViewProps,
} from 'react-native';
import Animated, { AnimatedProps } from 'react-native-reanimated';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';

import _SafeAreaView from '../components/SafeAreaView';
import colors from './colors';
import styled from './styled-components';
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
			: 'transparent',
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
