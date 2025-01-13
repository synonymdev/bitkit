import React, { memo } from 'react';
import { useAppSelector } from '../../hooks/redux';
import { viewControllersSelector } from '../../store/reselect/ui';
// import TransferFailed from '../bottom-sheet/TransferFailed';

import BoostPrompt from '../../screens/Wallets/BoostPrompt';
import NewTxPrompt from '../../screens/Wallets/NewTxPrompt';
import BackupNavigation from './BackupNavigation';
import ConnectionClosed from './ConnectionClosed';
import LNURLWithdrawNavigation from './LNURLWithdrawNavigation';
import OrangeTicketNavigation from './OrangeTicketNavigation';
import PINNavigation from './PINNavigation';
// import TreasureHuntNavigation from './TreasureHuntNavigation';
import PubkyAuth from './PubkyAuth';
import ReceiveNavigation from './ReceiveNavigation';
import SendNavigation from './SendNavigation';

const BottomSheets = (): JSX.Element => {
	const views = useAppSelector(viewControllersSelector);

	return (
		<>
			{views.backupNavigation.isMounted && <BackupNavigation />}
			{views.boostPrompt.isMounted && <BoostPrompt />}
			{views.connectionClosed.isMounted && <ConnectionClosed />}
			{views.lnurlWithdraw.isMounted && <LNURLWithdrawNavigation />}
			{views.newTxPrompt.isMounted && <NewTxPrompt />}
			{views.orangeTicket.isMounted && <OrangeTicketNavigation />}
			{views.PINNavigation.isMounted && <PINNavigation />}
			{views.receiveNavigation.isMounted && <ReceiveNavigation />}
			{views.sendNavigation.isMounted && <SendNavigation />}
			{/* {views.treasureHunt.isMounted && <TreasureHuntNavigation />} */}
			{views.pubkyAuth.isMounted && <PubkyAuth />}
		</>
	);
};

export default memo(BottomSheets);
