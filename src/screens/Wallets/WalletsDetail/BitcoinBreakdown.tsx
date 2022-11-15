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

import {
	Caption13M,
	Text01M,
	View,
	TransferIcon,
	SavingsIcon,
	CoinsIcon,
} from '../../../styles/components';
import { useBalance } from '../../../hooks/wallet';
import Money from '../../../components/Money';
import { RootNavigationProp } from '../../../navigation/types';
import { getOpenChannels } from '../../../utils/lightning';
import Store from '../../../store/types';

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
			<View color="transparent" style={styles.titleContainer}>
				<View style={[styles.networkIconContainer, { backgroundColor: color }]}>
					{icon}
				</View>
				<View color="transparent">
					<Text01M>{title}</Text01M>
					<Caption13M color="gray1">{subtitle}</Caption13M>
				</View>
			</View>
			<View color="transparent" style={styles.valueContainer}>
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
	const navigation = useNavigation<RootNavigationProp>();
	const isGeoBlocked = useSelector(
		(store: Store) => store.user?.isGeoBlocked ?? false,
	);
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
			navigation.navigate('LightningRoot', {
				screen: 'QuickSetup',
				params: {
					headerTitle: 'Transfer Funds',
				},
			});
		} else {
			navigation.navigate('LightningRoot', {
				screen: 'Introduction',
			});
		}
	}, [hasLightning, isGeoBlocked, navigation]);

	return (
		<View color="transparent" style={styles.container}>
			<NetworkRow
				title="Savings Balance"
				subtitle="On-chain BTC"
				color="rgba(247, 147, 26, 0.16)"
				icon={<SavingsIcon color="orange" width={17} height={17} />}
				satoshis={onchain}
			/>
			<View color="transparent" style={styles.transferRow}>
				<View color="gray4" style={styles.line} />
				<TouchableOpacity onPress={onRebalancePress}>
					<View style={styles.transferButton} color="white08">
						<TransferIcon height={13} color="white" />
					</View>
				</TouchableOpacity>
				<View color="gray4" style={styles.line} />
			</View>
			<NetworkRow
				title="Spending Balance"
				subtitle="Instant BTC"
				color="rgba(185, 92, 232, 0.16)"
				icon={<CoinsIcon color="purple" width={13} height={13} />}
				satoshis={lightning}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {},
	networkRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	transferRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
	},
	line: {
		flex: 1,
		height: 1,
	},
	networkIconContainer: {
		backgroundColor: 'rgba(185, 92, 232, 0.16)',
		borderRadius: 30,
		overflow: 'hidden',
		height: 32,
		width: 32,
		marginRight: 14,
		justifyContent: 'center',
		alignItems: 'center',
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
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	valueContainer: {
		alignItems: 'flex-end',
	},
});

export default memo(BitcoinBreakdown);
