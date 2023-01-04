import styled from 'styled-components/native';
import { sanFranciscoWeights } from 'react-native-typography';

export const Text = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontWeight: props.font
		? props.theme.fonts[props.font].fontWeight
		: sanFranciscoWeights.medium.fontWeight,
}));

export const Text01S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '17px',
	lineHeight: '22px',
}));

export const Text01M = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.semibold.fontFamily,
	fontSize: props.size ? props.size : '17px',
}));

export const Text01B = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.bold.fontFamily,
	fontSize: props.size ? props.size : '17px',
}));

export const Text02S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '15px',
	lineHeight: '20px',
}));

export const Text02M = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.semibold.fontFamily,
	fontSize: props.size ? props.size : '15px',
}));

export const Text02B = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '15px',
}));

export const Text13S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Text13UP = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '13px',
	textTransform: 'uppercase',
}));

export const Display = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: 'NHaasGroteskDSW02-65Md',
	fontSize: props.size ? props.size : '48px',
	lineHeight: props.lineHeight ?? '48px',
}));

export const Headline = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: 'NHaasGroteskDSW02-65Md',
	fontSize: props.size ? props.size : '34px',
	lineHeight: props.lineHeight ?? '34px',
}));

export const Title = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: 'NHaasGroteskDSW02-65Md',
	fontSize: props.size ? props.size : '22px',
}));

export const Subtitle = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.bold.fontFamily,
	fontSize: props.size ? props.size : '17px',
}));

export const SubHeadM = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontWeight: 500,
	fontSize: props.size ? props.size : '14px',
}));

export const Caption13S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Caption13M = styled.Text.attrs((props) => props)((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.semibold.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Caption13Up = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '13px',
	lineHeight: '18px',
	textTransform: 'uppercase',
}));
