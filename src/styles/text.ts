import { Platform } from 'react-native';

import styled from './styled-components';
import { IThemeColors } from './themes';

type TextProps = {
	color?: keyof IThemeColors;
};

export const Display = styled.Text<TextProps & { lineHeight?: number }>(
	({ theme, color, lineHeight = 44 }) => ({
		...theme.fonts.black,
		fontSize: '44px',
		color: theme.colors[color ?? 'primary'],
		letterSpacing: -1,
		textTransform: 'uppercase',
		// fix glyphs cut off at the top
		lineHeight: `${lineHeight}px`,
		paddingTop: lineHeight,
		marginTop: -lineHeight,
		// because of the negative margin, the component may overlap with other elements
		pointerEvents: 'none',
	}),
);

export const Headline = styled.Text<TextProps & { lineHeight?: number }>(
	({ theme, color, lineHeight = 30 }) => ({
		...theme.fonts.black,
		fontSize: '30px',
		color: theme.colors[color ?? 'primary'],
		letterSpacing: -1,
		textTransform: 'uppercase',
		// fix glyphs cut off at the top
		lineHeight: `${lineHeight}px`,
		paddingTop: lineHeight,
		marginTop: -lineHeight,
		// because of the negative margin, the component may overlap with other elements
		pointerEvents: 'none',
	}),
);

export const DrawerText = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.black,
	fontSize: '24px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: -1,
}));

export const Title = styled.Text<TextProps & { lineHeight?: number }>(
	({ theme, color, lineHeight = 26 }) => ({
		...theme.fonts.bold,
		fontSize: '22px',
		color: theme.colors[color ?? 'primary'],
		letterSpacing: 0.4,
		// fix glyphs cut off at the top
		lineHeight: `${lineHeight}px`,
		paddingTop: lineHeight,
		marginTop: -lineHeight,
		// because of the negative margin, the component may overlap with other elements
		pointerEvents: 'none',
	}),
);

export const Subtitle = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.bold,
	fontSize: '17px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: 0.4,
}));

export const Text = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.medium,
	color: theme.colors[color ?? 'primary'],
	letterSpacing: 0.4,
}));

export const BodyM = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '17px',
	lineHeight: '22px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const BodyMSB = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.semiBold,
	fontSize: '17px',
	lineHeight: '22px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const BodyMB = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.bold,
	fontSize: '17px',
	lineHeight: '22px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const BodyS = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '15px',
	lineHeight: '20px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const BodySSB = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.semiBold,
	fontSize: '15px',
	lineHeight: '20px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const BodySB = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.bold,
	fontSize: '15px',
	lineHeight: '20px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const Text13UP = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.medium,
	fontSize: '13px',
	lineHeight: '18px',
	textTransform: 'uppercase',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const Caption = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '13px',
	lineHeight: '18px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const CaptionB = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.semiBold,
	fontSize: '13px',
	lineHeight: '18px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));

export const Caption13Up = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.medium,
	fontSize: '13px',
	lineHeight: '18px',
	textTransform: 'uppercase',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: Platform.OS === 'ios' ? 0.8 : undefined,
}));

export const Footnote = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.medium,
	fontSize: '12px',
	lineHeight: '16px',
	color: theme.colors[color ?? 'white32'],
	letterSpacing: Platform.OS === 'ios' ? 0.4 : undefined,
}));
