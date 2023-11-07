import { TAvailableNetworks } from './networks';
import { getSelectedNetwork, getSelectedWallet } from './wallet';
import {
	EWarningIds,
	TGetImpactedAddressesRes,
	TStorageWarning,
} from '../store/types/checks';
import { getAddressBalance } from './wallet/electrum';
import { err, ok, Result } from '@synonymdev/result';
import { TWalletName } from '../store/types/wallet';
import { addWarning, updateWarning } from '../store/actions/checks';
import { getChecksStore } from '../store/helpers';
import { Platform } from 'react-native';
import { version } from '../../package.json';
import { TChannel } from '@synonymdev/react-native-ldk';
import { v4 as uuidv4 } from 'uuid';

/**
 * Reports the balance of all impacted addresses stored on the device.
 * @param {TAvailableNetworks} [selectedNetwork]
 * @param {TGetImpactedAddressesRes} impactedAddressRes
 * @returns {Promise<Result<number>>}
 */
export const reportImpactedAddressBalance = async ({
	selectedNetwork,
	impactedAddressRes,
}: {
	selectedNetwork: TAvailableNetworks;
	impactedAddressRes: TGetImpactedAddressesRes;
}): Promise<Result<number>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

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
		selectedNetwork,
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

export const reportLdkChannelMigrations = async ({
	selectedNetwork,
	channels,
}: {
	selectedNetwork: TAvailableNetworks;
	channels: TChannel[];
}): Promise<Result<string>> => {
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	const warnings = getWarnings({
		selectedNetwork,
	});
	const ldkMigrationWarnings = warnings.filter(
		(w) => w.warningId === EWarningIds.ldkMigration,
	);
	const reportedChannelIds = ldkMigrationWarnings
		.filter((warning) => warning.warningId === EWarningIds.ldkMigration)
		.map((warning) => (warning.data as TChannel).channel_id);

	const url =
		selectedNetwork === 'bitcoin'
			? 'https://api.blocktank.to/bk-info'
			: 'http://35.233.47.252/bitkit-alerts';

	for (const channel of channels) {
		if (reportedChannelIds.includes(channel.channel_id)) {
			continue;
		}
		const res = await fetch(url, {
			method: 'POST',
			body: JSON.stringify({
				id: EWarningIds.ldkMigration,
				channelId: channel.channel_id,
				platform: Platform.OS,
				version,
				network: selectedNetwork,
				timestamp: Date.now(),
			}),
			headers: { 'Content-Type': 'application/json' },
		});

		if (!res.ok) {
			return err('Failed to report channel migrations for force-close.');
		}
		addWarning({
			warning: {
				id: uuidv4(),
				warningId: EWarningIds.storageCheck,
				data: channel,
				warningReported: true,
				timestamp: new Date().getTime(),
			},
			selectedNetwork,
		});
	}
	return ok('Reported LDK channel migrations for force-close.');
};

/**
 * Reports all unreported warnings.
 * Warnings can go unreported if the user closes the app before the report is sent,
 * the report fails to send, or the server is down.
 * @param {TStorageWarning} warnings
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {Promise<number>}
 */
export const reportUnreportedWarnings = async ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): Promise<number> => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}

	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}

	const warnings = getWarnings({ selectedWallet, selectedNetwork });

	const unreportedWarnings = warnings.filter(
		(warning) => !warning.warningReported,
	);

	let warningsReported = 0;

	await Promise.all(
		unreportedWarnings.map(async (warning: TStorageWarning) => {
			if (!selectedWallet) {
				selectedWallet = getSelectedWallet();
			}
			if (!selectedNetwork) {
				selectedNetwork = getSelectedNetwork();
			}
			const reportRes = await reportImpactedAddressBalance({
				selectedNetwork,
				impactedAddressRes: warning.data as TGetImpactedAddressesRes,
			});

			if (reportRes.isErr()) {
				// Server could be down, try again later.
				return;
			}

			warningsReported++;

			const updatedWarning: TStorageWarning = {
				...warning,
				warningReported: true,
			};
			updateWarning({
				selectedWallet,
				selectedNetwork,
				id: warning.id,
				warningData: updatedWarning,
			});
		}),
	);
	return warningsReported;
};

/**
 * Returns all warnings for the selected wallet and network.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {TStorageWarning[]}
 */
export const getWarnings = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): TStorageWarning[] => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	return getChecksStore()[selectedWallet].warnings[selectedNetwork];
};
