import { BlurView } from '@react-native-community/blur';
import React, { ReactElement } from 'react';
import {
	Platform,
	Pressable,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BodySSB } from '../../styles/text';
import { lighten } from '../../utils/color';

const ButtonBlur = ({
	text,
	icon,
	style,
	testID,
	onPress,
}: {
	text: string;
	icon?: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	return (
		<Pressable style={styles.root} testID={testID} onPress={onPress}>
			{({ pressed }) => {
				const Wrapper = Platform.OS === 'ios' ? BlurView : View;
				return (
					<Wrapper
						style={[styles.blur, style, pressed && styles.pressed]}
						blurAmount={4}>
						{icon && <SvgXml xml={icon} width={13} height={13} />}
						<BodySSB style={styles.text}>{text}</BodySSB>
					</Wrapper>
				);
			}}
		</Pressable>
	);
};

const bgColor = Platform.select({
	ios: 'rgba(255, 255, 255, 0.2)',
	android: 'rgba(40, 40, 40, 0.95)',
});

const styles = StyleSheet.create({
	root: {
		height: 56,
		flex: 1,
		shadowColor: 'black',
		shadowOpacity: 0.8,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 13 },
	},
	blur: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		borderRadius: 30,
		elevation: 6,
		backgroundColor: bgColor,
	},
	text: {
		marginLeft: 6,
	},
	pressed: {
		backgroundColor: lighten(bgColor),
	},
});

export default ButtonBlur;
