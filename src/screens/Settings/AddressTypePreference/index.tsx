import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { getSelectedAddressType, refreshWallet } from '../../../utils/wallet';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { TAddressType } from '../../../store/types/wallet';
import { updateSettings } from '../../../store/actions/settings';
import { useAppSelector } from '../../../hooks/redux';
import type { SettingsScreenProps } from '../../../navigation/types';

const typesDescriptions = {
	p2wpkh: {
		description: 'Pay-to-witness-public-key-hash',
		example: '(bc1x...)',
		name: 'Native Segwit Bech32',
	},
	p2sh: {
		description: 'Pay-to-Script-Hash',
		example: '(3x...)',
		name: 'Wrapped Segwit',
	},
	p2pkh: {
		description: 'Pay-to-public-key-hash',
		example: '(1x...)',
		name: 'Legacy',
	},
};

const sortOrder = ['p2wpkh', 'p2sh', 'p2pkh'];

const AddressTypeSettings = ({
	navigation,
}: SettingsScreenProps<'AddressTypePreference'>): ReactElement => {
	const [addressTypeState, setAddressTypeState] = useState<TAddressType>();
	const addressTypes = useAppSelector((state) => state.wallet.addressTypes);
	const selectedWallet = useAppSelector((state) => state.wallet.selectedWallet);
	const selectedNetwork = useAppSelector(
		(state) => state.wallet.selectedNetwork,
	);

	const addressTypesList = useMemo(() => {
		return Object.values(addressTypes)
			.map(({ type }) => {
				return {
					value: type,
					label: `${typesDescriptions[type].name} ${typesDescriptions[type].example}`,
					description: typesDescriptions[type].description,
				};
			})
			.sort((a, b) => sortOrder.indexOf(a.value) - sortOrder.indexOf(b.value));
	}, [addressTypes]);

	const selectedAddressType = useMemo(
		(): string =>
			getSelectedAddressType({
				selectedWallet,
				selectedNetwork,
			}),
		[selectedNetwork, selectedWallet],
	);

	const setAddressTypePreference = useCallback(
		(preference: TAddressType): void => {
			setAddressTypeState(preference);
			updateSelectedAddressType({ addressType: preference });
			refreshWallet({}).then();
		},
		[],
	);

	const checkAddressTypeListCheckmark = useCallback(
		(type: TAddressType): boolean => {
			if (selectedAddressType === addressTypeState) {
				return addressTypeState === type;
			}
			if (!addressTypeState) {
				return selectedAddressType === type;
			}
			return addressTypeState === type;
		},
		[selectedAddressType, addressTypeState],
	);

	const AddressTypeListData: IListData[] = useMemo(
		() => [
			{
				title: 'Bitcoin address type',
				data: addressTypesList.map((addressType) => ({
					type: 'button',
					value: checkAddressTypeListCheckmark(addressType.value),
					description: addressType.description,
					title: addressType.label,
					useCheckmark: true,
					onPress: async (): Promise<void> => {
						navigation.goBack();
						updateSettings({ addressType: addressType.value });
						setAddressTypePreference(addressType.value);
						await refreshWallet({ lightning: false, onchain: true });
					},
				})),
			},
		],
		[
			addressTypesList,
			checkAddressTypeListCheckmark,
			navigation,
			setAddressTypePreference,
		],
	);

	return (
		<SettingsView
			title="Bitcoin Address Type"
			listData={AddressTypeListData}
			showBackNavigation
		/>
	);
};

export default memo(AddressTypeSettings);
