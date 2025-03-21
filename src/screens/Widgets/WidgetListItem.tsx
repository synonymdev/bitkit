import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Divider from '../../components/Divider';
import { widgets } from '../../constants/widgets';
import { useCurrency } from '../../hooks/displayValues';
import { RootNavigationProp } from '../../navigation/types';
import { TWidgetId } from '../../store/types/widgets';
import { TouchableOpacity, View } from '../../styles/components';
import { ChevronRight } from '../../styles/icons';
import { BodyMSB, CaptionB } from '../../styles/text';

const WidgetListItem = ({ id }: { id: TWidgetId }): ReactElement => {
	const navigation = useNavigation<RootNavigationProp>();
	const { t } = useTranslation('widgets');
	const { fiatSymbol } = useCurrency();

	const widget = {
		name: t(`${id}.name`),
		description: t(`${id}.description`, { fiatSymbol }),
		icon: widgets[id].icon,
	};

	const onPress = (): void => {
		navigation.navigate('Widget', { id });
	};

	return (
		<TouchableOpacity testID={`WidgetListItem-${id}`} onPress={onPress}>
			<View style={styles.feed}>
				<SvgXml style={styles.icon} xml={widget.icon} />
				<View style={styles.text}>
					<BodyMSB numberOfLines={1}>{widget.name}</BodyMSB>
					<CaptionB color="secondary" numberOfLines={1}>
						{widget.description}
					</CaptionB>
				</View>
				<ChevronRight
					style={styles.arrow}
					color="secondary"
					width={24}
					height={24}
				/>
			</View>
			<Divider />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	feed: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	icon: {
		height: 48,
		width: 48,
		marginRight: 16,
		borderRadius: 8,
		overflow: 'hidden',
	},
	text: {
		flex: 1,
		paddingRight: 20,
	},
	arrow: {
		marginLeft: 'auto',
	},
});

export default WidgetListItem;
