import React, { memo, ReactElement, useMemo } from 'react';
import {
	StyleSheet,
	ActivityIndicator,
	Platform,
	Pressable,
	PressableProps,
	StyleProp,
	ViewStyle,
	TextStyle,
} from 'react-native';
import { IThemeColors } from '../../styles/themes';
import { CaptionB, BodySSB } from '../../styles/text';
import { View } from '../../styles/components';
import useColors from '../../hooks/colors';
import { lighten } from '../../utils/color';

export interface ButtonProps extends PressableProps {
	text?: string | ReactElement;
	color?: keyof IThemeColors;
	variant?: 'primary' | 'secondary' | 'tertiary';
	size?: 'small' | 'large';
	loading?: boolean;
	icon?: ReactElement;
	style?: StyleProp<ViewStyle>;
	textStyle?: TextStyle;
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
}: ButtonProps): ReactElement => {
	const colors = useColors();
	const { white, white16, white32, white80 } = colors;

	const defaultBgColor = variant === 'primary' ? white16 : 'transparent';
	const bgColor = color ? colors[color] : defaultBgColor;
	const borderColor = variant === 'tertiary' ? undefined : white16;

	const buttonStyle = useMemo(() => {
		return StyleSheet.compose(
			{
				...styles.buttonBase,
				backgroundColor: bgColor,
				...(size === 'small' ? styles.buttonSmall : styles.buttonLarge),
				...(variant !== 'primary' && {
					...styles.buttonSecondary,
					borderColor,
				}),
				...(disabled && !icon
					? { backgroundColor: 'transparent', borderColor: 'transparent' }
					: {}),
				...(disabled && icon ? { opacity: disabled ? 0.5 : 1 } : {}),
			},
			style,
		);
	}, [variant, size, icon, bgColor, borderColor, disabled, style]);

	const buttonPressedStyle = useMemo(() => {
		// double the opacity for pressed state
		const bgColorLightened = lighten(bgColor);
		const borderColorLightened = lighten(borderColor);
		return {
			backgroundColor: variant === 'primary' ? bgColorLightened : undefined,
			borderColor: variant === 'secondary' ? borderColorLightened : undefined,
		};
	}, [variant, bgColor, borderColor]);

	const textStyles = useMemo(() => {
		return {
			...textStyle,
			...(text && icon && { marginLeft: 8 }),
			...(text && !icon && { maxWidth: '100%', textAlign: 'center' }), // on android text sometimes get shrinked. So if there is no icon, make sure it takes the full width
			...(variant === 'primary' ? {} : { color: white80 }),
			...(disabled && !icon && { color: white32 }),
			...Platform.select({
				android: {
					lineHeight: size === 'small' ? 15 : 18,
				},
			}),
		};
	}, [textStyle, text, icon, variant, disabled, size, white32, white80]);

	const textPressedStyles = useMemo(() => {
		return {
			...(variant === 'tertiary' ? { color: white } : {}),
		};
	}, [variant, white]);

	const Text = size === 'small' ? CaptionB : BodySSB;

	return (
		<Pressable
			style={({ pressed }) => [buttonStyle, pressed && buttonPressedStyle]}
			accessibilityLabel={disabled ? 'disabled' : 'enabled'}
			disabled={loading || disabled}
			{...props}>
			{({ pressed }) => {
				return (
					<>
						{icon && (
							<View color="transparent">
								{icon}
								{/* {React.cloneElement(icon, {
									...{ ...(disabled && { color: 'white32' }) },
								})} */}
							</View>
						)}

						<Text
							style={[textStyles, pressed && textPressedStyles]}
							numberOfLines={1}>
							{text}
						</Text>

						{loading && (
							<View color="onSurface" style={styles.loading}>
								<ActivityIndicator size="small" />
							</View>
						)}
					</>
				);
			}}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	buttonBase: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		// TODO: shadows are not drawn correctly on transparent buttons
		// shadowColor: 'rgba(0, 0, 0, 0.1)',
		// shadowOpacity: 0.8,
		// elevation: 6,
		// shadowRadius: 15,
		// shadowOffset: { width: 1, height: 13 },
	},
	buttonSmall: {
		minHeight: 40,
		borderRadius: 54,
		paddingHorizontal: 16,
	},
	buttonLarge: {
		height: 56,
		borderRadius: 64,
		paddingHorizontal: 23,
		minWidth: 110,
	},
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
	},
});

export default memo(Button);
