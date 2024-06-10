import styled from './styled-components';
import { IThemeColors } from './themes';

type TextProps = {
	color?: keyof IThemeColors;
};

export const Display = styled.Text<TextProps & { lineHeight?: number }>(
	({ theme, color, lineHeight = 44 }) => ({
		...theme.fonts.black,
		fontSize: '44px',
		color: theme.colors[color ?? 'white'],
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

export const BodyM = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '17px',
	lineHeight: '22px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: 0.4,
}));

export const BodyMB = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.bold,
	fontSize: '17px',
	lineHeight: '22px',
	color: theme.colors[color ?? 'primary'],
	letterSpacing: 0.4,
}));
