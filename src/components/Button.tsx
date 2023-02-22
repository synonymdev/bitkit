import React, { memo, ReactElement, useMemo } from 'react';
import {
	StyleSheet,
	ActivityIndicator,
	TouchableOpacityProps,
	Platform,
} from 'react-native';
import { View, TouchableOpacity } from '../styles/components';
import { Caption13M, Text02M } from '../styles/text';
import useColors from '../hooks/colors';
import { IThemeColors } from '../styles/themes';

export interface IButton extends TouchableOpacityProps {
	text?: string | ReactElement;
	color?: keyof IThemeColors;
	variant?: 'primary' | 'secondary' | 'transparent';
	size?: 'small' | 'large';
	disabled?: boolean;
	loading?: boolean;
	icon?: ReactElement;
	textStyle?: Object;
}

const Button = ({
	text,
	color,
	variant = 'primary',
	size = 'small',
	disabled = false,
	loading = false,
	textStyle = {},
	style,
	icon,
	...props
}: IButton): ReactElement => {
	const { white08, white32 } = useColors();

	const buttonStyle = useMemo(() => {
		const borderColor = variant === 'transparent' ? undefined : white08;

		return StyleSheet.compose(
			{
				...styles.buttonBase,
				...(size === 'small' ? styles.buttonSmall : styles.buttonLarge),
				...(variant === 'primary'
					? styles.buttonPrimary
					: { ...styles.buttonSecondary, borderColor }),
				...(disabled && !icon
					? { backgroundColor: 'transparent', borderColor: 'transparent' }
					: {}),
				...(disabled && icon ? { opacity: disabled ? 0.5 : 1 } : {}),
			},
			style,
		);
	}, [variant, size, icon, disabled, white08, style]);

	const buttonColor = useMemo(() => {
		if (color) {
			return color;
		}
		return variant === 'primary' ? 'white08' : 'transparent';
	}, [color, variant]);

	const textStyles = useMemo(() => {
		return {
			...textStyle,
			...(text && icon && { marginLeft: 8 }),
			...(disabled && !icon && { color: white32 }),
			...Platform.select({
				android: {
					lineHeight: size === 'small' ? 15 : 18,
				},
			}),
		};
	}, [textStyle, text, icon, disabled, white32, size]);

	const Text = size === 'small' ? Caption13M : Text02M;

	return (
		// @ts-ignore react-native and styled-components types clashing
		<TouchableOpacity
			activeOpacity={0.6}
			color={buttonColor}
			style={buttonStyle}
			disabled={loading || disabled}
			{...props}>
			{icon && (
				<View color="transparent">
					{React.cloneElement(icon, {
						...{ ...(disabled && { color: 'white32' }) },
					})}
				</View>
			)}

			<Text style={textStyles} numberOfLines={1}>
				{text}
			</Text>

			{loading && (
				<View color="onSurface" style={styles.loading}>
					<ActivityIndicator size="small" />
				</View>
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	buttonBase: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		shadowColor: 'rgba(0, 0, 0, 0.1)',
		shadowOpacity: 0.8,
		elevation: 6,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 13 },
	},
	buttonSmall: {
		height: 40,
		borderRadius: 54,
		paddingHorizontal: 16,
		minWidth: 110,
	},
	buttonLarge: {
		height: 56,
		borderRadius: 64,
		paddingHorizontal: 23,
		minWidth: 110,
	},
	buttonPrimary: {},
	buttonSecondary: {
		borderWidth: 2,
	},
	loading: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'center',
		borderRadius: 54,
		paddingVertical: 12,
		paddingHorizontal: 16,
		shadowColor: 'rgba(0, 0, 0, 0.1)',
		shadowOpacity: 0.8,
		elevation: 6,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 13 },
	},
});

export default memo(Button);
