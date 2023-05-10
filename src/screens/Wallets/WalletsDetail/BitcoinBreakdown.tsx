import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { View } from '../../../styles/components';
import { Caption13M, Text01M } from '../../../styles/text';
import { TransferIcon, SavingsIcon, CoinsIcon } from '../../../styles/icons';
import { useBalance } from '../../../hooks/wallet';
import Money from '../../../components/Money';
import { RootNavigationProp } from '../../../navigation/types';
import { getOpenChannels } from '../../../utils/lightning';
import { isGeoBlockedSelector } from '../../../store/reselect/user';

const NetworkRow = ({
	title,
	subtitle,
	color,
	icon,
	satoshis,
}: {
	title: string;
	subtitle: string;
	color: string;
	icon: ReactElement;
	satoshis: number;
}): ReactElement => {
	return (
		<View color="transparent" style={styles.networkRow}>
			<View style={[styles.icon, { backgroundColor: color }]}>{icon}</View>
			<View style={styles.text} color="transparent">
				<Text01M>{title}</Text01M>
				<Caption13M color="gray1">{subtitle}</Caption13M>
			</View>
			<View style={styles.amount} color="transparent">
				<Money sats={satoshis} size="text01m" enableHide={true} />
				<Money
					sats={satoshis}
					enableHide={true}
					size="caption13M"
					showFiat={true}
					color="gray1"
				/>
			</View>
		</View>
	);
};

const BitcoinBreakdown = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const isGeoBlocked = useSelector(isGeoBlockedSelector);
	const { satoshis: onchain } = useBalance({ onchain: true });
	const { satoshis: lightning } = useBalance({ lightning: true });
	const [hasLightning, setHasLightning] = useState<boolean>(false);

	useEffect(() => {
		getOpenChannels({ fromStorage: true }).then((res) => {
			if (res.isOk() && res.value.length > 0) {
				setHasLightning(true);
			}
		});
	}, []);

	const onRebalancePress = useCallback(() => {
		if (hasLightning && !isGeoBlocked) {
			navigation.navigate('Transfer', { screen: 'Setup' });
		} else {
			navigation.navigate('LightningRoot', { screen: 'Introduction' });
		}
	}, [hasLightning, isGeoBlocked, navigation]);

	return (
		<>
			<NetworkRow
				title={t('details_savings_title')}
				subtitle={t('details_savings_subtitle')}
				color="rgba(247, 147, 26, 0.16)"
				icon={<SavingsIcon color="brand" width={17} height={17} />}
				satoshis={onchain}
			/>
			<View color="transparent" style={styles.transferRow}>
				<View color="gray4" style={styles.line} />
				<TouchableOpacity testID="TransferButton" onPress={onRebalancePress}>
					<View style={styles.transferButton} color="white08">
						<TransferIcon height={13} color="white" />
					</View>
				</TouchableOpacity>
				<View color="gray4" style={styles.line} />
			</View>
			<NetworkRow
				title={t('details_spending_title')}
				subtitle={t('details_spending_subtitle')}
				color="rgba(185, 92, 232, 0.16)"
				icon={<CoinsIcon color="purple" width={13} height={13} />}
				satoshis={lightning}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	networkRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		minHeight: 40,
	},
	icon: {
		backgroundColor: 'rgba(185, 92, 232, 0.16)',
		borderRadius: 20,
		height: 32,
		width: 32,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		marginRight: 16,
	},
	text: {
		justifyContent: 'space-between',
	},
	amount: {
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginLeft: 'auto',
	},
	transferRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
	},
	transferButton: {
		paddingHorizontal: 15,
		height: 36,
		borderRadius: 34,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginHorizontal: 16,
	},
	line: {
		flex: 1,
		height: 1,
	},
});

export default memo(BitcoinBreakdown);
