import Clipboard from '@react-native-clipboard/clipboard';
import SDK from '@synonymdev/slashtags-sdk';

import { navigate } from '../../navigation/root/RootNavigator';
import { toggleView } from '../../store/actions/user';
import { updateBitcoinTransaction } from '../../store/actions/wallet';
import { getStore } from '../../store/helpers';
import { showSuccessNotification } from '../notifications';
import { decodeQRData } from '../scanner';

export const readClipboardInvoice = async ({
	onChainBalance,
	lightningBalance,
	sdk,
}: {
	onChainBalance: number;
	lightningBalance: number;
	sdk: SDK;
}): Promise<void> => {
	const state = getStore();
	const selectedNetwork = state.wallet.selectedNetwork;

	const clipboardData = await Clipboard.getString();

	if (!clipboardData) {
		return;
	}

	const result = await decodeQRData(clipboardData);

	// TODO: refactor processInputData to be reused here
	if (result.isOk() && result.value.length) {
		const { qrDataType, address, network, sats } = result.value[0];

		if (network !== selectedNetwork) {
			return;
		}

		if (!sats || sats === 0) {
			return;
		}

		if (qrDataType === 'lightningPaymentRequest') {
			if (lightningBalance < sats) {
				return;
			}

			// TODO: not handled yet
			return;
		}

		if (qrDataType === 'slashURL') {
			console.log('sdk', sdk);
			// TODO(?): not handled yet
			return;
		}

		if (qrDataType === 'bitcoinAddress') {
			if (onChainBalance < sats) {
				return;
			}

			updateBitcoinTransaction({
				transaction: { outputs: [{ address, value: sats, index: 0 }] },
			});
		}

		navigate('Tabs');
		toggleView({
			view: 'sendNavigation',
			data: { isOpen: true },
		});
		showSuccessNotification({
			title: 'Clipboard Data Detected',
			message: 'Bitkit redirected you to the payment screen.',
		});
	}
};
