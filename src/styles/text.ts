import { Platform } from 'react-native';
import { sanFranciscoWeights } from 'react-native-typography';
import styled from './styled-components';

type TextProps = {
	color?: string;
};

export const Display = styled.Text<TextProps & { lineHeight?: string }>(
	({ theme, color, lineHeight }) => ({
		fontFamily: 'NHaasGroteskDSW02-65Md',
		fontSize: '48px',
		lineHeight: lineHeight ?? '48px',
		color: theme.colors[color ?? 'text'],
	}),
);

export const Headline = styled.Text<TextProps & { lineHeight?: string }>(
	({ theme, color, lineHeight }) => ({
		fontFamily: 'NHaasGroteskDSW02-65Md',
		fontSize: '34px',
		lineHeight: lineHeight ?? '34px',
		color: theme.colors[color ?? 'text'],
	}),
);

export const Title = styled.Text<TextProps>(({ theme, color }) => ({
	fontFamily: 'NHaasGroteskDSW02-65Md',
	fontSize: '22px',
	color: theme.colors[color ?? 'text'],
}));

export const Subtitle = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.bold.fontFamily,
			fontWeight: sanFranciscoWeights.bold.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Bold',
		},
	}),
	fontSize: '17px',
	color: theme.colors[color ?? 'text'],
}));

export const Text = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.medium.fontFamily,
			fontWeight: sanFranciscoWeights.medium.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Medium',
		},
	}),
	color: theme.colors[color ?? 'text'],
}));

export const Text01S = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.regular.fontFamily,
			fontWeight: sanFranciscoWeights.regular.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Regular',
		},
	}),
	fontSize: '17px',
	lineHeight: '22px',
	color: theme.colors[color ?? 'text'],
}));

export const Text01M = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.semibold.fontFamily,
			fontWeight: sanFranciscoWeights.semibold.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Medium',
		},
	}),
	fontSize: '17px',
	color: theme.colors[color ?? 'text'],
}));

export const Text01B = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.bold.fontFamily,
			fontWeight: sanFranciscoWeights.bold.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Bold',
		},
	}),
	fontSize: '17px',
	color: theme.colors[color ?? 'text'],
}));

export const Text02S = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.regular.fontFamily,
			fontWeight: sanFranciscoWeights.regular.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Regular',
		},
	}),
	fontSize: '15px',
	lineHeight: '20px',
	color: theme.colors[color ?? 'text'],
}));

export const Text02M = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.semibold.fontFamily,
			fontWeight: sanFranciscoWeights.semibold.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Medium',
		},
	}),
	fontSize: '15px',
	color: theme.colors[color ?? 'text'],
}));

export const Text02B = styled.Text<TextProps & { size?: string }>(
	({ theme, color, size }) => ({
		...Platform.select({
			ios: {
				fontFamily: sanFranciscoWeights.bold.fontFamily,
				fontWeight: sanFranciscoWeights.bold.fontWeight,
			},
			android: {
				fontFamily: 'Roboto-Bold',
			},
		}),
		fontSize: size ? size : '15px',
		color: theme.colors[color ?? 'text'],
	}),
);

export const Text13S = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.regular.fontFamily,
			fontWeight: sanFranciscoWeights.regular.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Regular',
		},
	}),
	fontSize: '13px',
	color: theme.colors[color ?? 'text'],
}));

export const Text13UP = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.medium.fontFamily,
			fontWeight: sanFranciscoWeights.medium.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Medium',
		},
	}),
	fontSize: '13px',
	textTransform: 'uppercase',
	color: theme.colors[color ?? 'text'],
}));

export const Caption13S = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.regular.fontFamily,
			fontWeight: sanFranciscoWeights.regular.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Regular',
		},
	}),
	fontSize: '13px',
	color: theme.colors[color ?? 'text'],
}));

export const Caption13M = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.semibold.fontFamily,
			fontWeight: sanFranciscoWeights.semibold.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Medium',
		},
	}),
	fontSize: '13px',
	color: theme.colors[color ?? 'text'],
}));

export const Caption13Up = styled.Text<TextProps>(({ theme, color }) => ({
	...Platform.select({
		ios: {
			fontFamily: sanFranciscoWeights.medium.fontFamily,
			fontWeight: sanFranciscoWeights.medium.fontWeight,
		},
		android: {
			fontFamily: 'Roboto-Medium',
		},
	}),
	fontSize: '13px',
	lineHeight: '18px',
	textTransform: 'uppercase',
	color: theme.colors[color ?? 'text'],
}));
