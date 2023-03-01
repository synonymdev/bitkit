import styled from './styled-components';
import { IThemeColors } from './themes';

type TextProps = {
	color?: keyof IThemeColors;
	money?: boolean;
};

export const Display = styled.Text<TextProps & { lineHeight?: string }>(
	({ theme, color, lineHeight, money }) => ({
		...theme.fonts[money ? 'headerMoney' : 'header'],
		fontSize: '48px',
		lineHeight: lineHeight ?? '48px',
		color: theme.colors[color ?? 'text'],
	}),
);

export const Headline = styled.Text<TextProps & { lineHeight?: string }>(
	({ theme, color, lineHeight, money }) => ({
		...theme.fonts[money ? 'headerMoney' : 'header'],
		fontSize: '34px',
		lineHeight: lineHeight ?? '34px',
		color: theme.colors[color ?? 'text'],
	}),
);

export const Title = styled.Text<TextProps>(({ theme, color, money }) => ({
	...theme.fonts[money ? 'headerMoney' : 'header'],
	fontSize: '22px',
	color: theme.colors[color ?? 'text'],
}));

export const Subtitle = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.bold,
	fontSize: '17px',
	color: theme.colors[color ?? 'text'],
}));

export const Text = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.medium,
	color: theme.colors[color ?? 'text'],
}));

export const Text01S = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '17px',
	lineHeight: '22px',
	color: theme.colors[color ?? 'text'],
}));

export const Text01M = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.semibold,
	fontSize: '17px',
	color: theme.colors[color ?? 'text'],
}));

export const Text01B = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.bold,
	fontSize: '17px',
	color: theme.colors[color ?? 'text'],
}));

export const Text02S = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '15px',
	lineHeight: '20px',
	color: theme.colors[color ?? 'text'],
}));

export const Text02M = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.semibold,
	fontSize: '15px',
	color: theme.colors[color ?? 'text'],
}));

export const Text02B = styled.Text<TextProps & { size?: string }>(
	({ theme, color, size }) => ({
		...theme.fonts.bold,
		fontSize: size ? size : '15px',
		color: theme.colors[color ?? 'text'],
	}),
);

export const Text13S = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '13px',
	color: theme.colors[color ?? 'text'],
}));

export const Text13UP = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.medium,
	fontSize: '13px',
	textTransform: 'uppercase',
	color: theme.colors[color ?? 'text'],
}));

export const Caption13S = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.regular,
	fontSize: '13px',
	color: theme.colors[color ?? 'text'],
}));

export const Caption13M = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.semibold,
	fontSize: '13px',
	color: theme.colors[color ?? 'text'],
}));

export const Caption13Up = styled.Text<TextProps>(({ theme, color }) => ({
	...theme.fonts.medium,
	fontSize: '13px',
	lineHeight: '18px',
	textTransform: 'uppercase',
	color: theme.colors[color ?? 'text'],
}));
