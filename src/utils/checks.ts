import { EAvailableNetwork } from './networks';
import { getSelectedNetwork, getSelectedWallet } from './wallet';
import {
	EWarningIds,
	TGetImpactedAddressesRes,
	TStorageWarning,
} from '../store/types/checks';
import { getAddressBalance } from './wallet/electrum';
import { err, ok, Result } from '@synonymdev/result';
import { TWalletName } from '../store/types/wallet';
import { updateWarning } from '../store/slices/checks';
import { dispatch, getChecksStore } from '../store/helpers';
import { Platform } from 'react-native';
import { version } from '../../package.json';

/**
 * Reports the balance of all impacted addresses stored on the device.
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TGetImpactedAddressesRes} impactedAddressRes
 * @returns {Promise<Result<number>>}
 */
export const reportImpactedAddressBalance = async ({
	selectedNetwork = getSelectedNetwork(),
	impactedAddressRes,
}: {
	selectedNetwork: EAvailableNetwork;
	impactedAddressRes: TGetImpactedAddressesRes;
}): Promise<Result<number>> => {
	const addresses = impactedAddressRes.impactedAddresses;
	const changeAddresses = impactedAddressRes.impactedChangeAddresses;

	const impactedAddresses = addresses.map((addressArr) => {
		return addressArr.addresses.map((address) => {
			return address.storedAddress.address;
		});
	});

	const impactedChangeAddresses = changeAddresses.map((changeAddressArr) => {
		return changeAddressArr.addresses.map((changeAddress) => {
			return changeAddress.storedAddress.address;
		});
	});

	const allAddresses = [
		...impactedAddresses,
		...impactedChangeAddresses,
	].flat();

	const balanceRes = await getAddressBalance({
		addresses: allAddresses,
	});

	if (balanceRes.isErr()) {
		return err(balanceRes.error.message);
	}

	const balance = balanceRes.value;

	const url =
		selectedNetwork === 'bitcoin'
			? 'https://api.blocktank.to/bk-info'
			: 'http://35.233.47.252/bitkit-alerts';

	const postImpactedBalanceResponse = await fetch(url, {
		method: 'POST',
		body: JSON.stringify({
			id: EWarningIds.storageCheck,
			balance,
			platform: Platform.OS,
			version,
			network: selectedNetwork,
			timestamp: Date.now(),
		}),
		headers: { 'Content-Type': 'application/json' },
	});

	if (!postImpactedBalanceResponse.ok) {
		return err('Failed to report impacted balance');
	}

	return ok(balance);
};

/**
 * Reports all unreported warnings.
 * Warnings can go unreported if the user closes the app before the report is sent,
 * the report fails to send, or the server is down.
 * @param {TStorageWarning} warnings
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {Promise<number>}
 */
export const reportUnreportedWarnings = async ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<number> => {
	const warnings = getWarnings({ selectedWallet, selectedNetwork });

	const unreportedWarnings = warnings.filter(
		(warning) => !warning.warningReported,
	);

	let warningsReported = 0;

	await Promise.all(
		unreportedWarnings.map(async (warning: TStorageWarning) => {
			const reportRes = await reportImpactedAddressBalance({
				selectedNetwork,
				impactedAddressRes: warning.data as TGetImpactedAddressesRes,
			});

			if (reportRes.isErr()) {
				// Server could be down, try again later.
				return;
			}

			warningsReported++;

			dispatch(
				updateWarning({
					warning: { ...warning, warningReported: true },
					selectedWallet,
					selectedNetwork,
				}),
			);
		}),
	);
	return warningsReported;
};

/**
 * Returns all warnings for the selected wallet and network.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {TStorageWarning[]}
 */
export const getWarnings = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): TStorageWarning[] => {
	return getChecksStore()[selectedWallet].warnings[selectedNetwork];
};
