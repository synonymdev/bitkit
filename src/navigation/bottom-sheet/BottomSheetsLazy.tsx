import React, { Suspense, lazy } from 'react';

const BottomSheets = lazy(() => import('./BottomSheets'));

const BottomSheetsLazy = (): JSX.Element => {
	return (
		<Suspense fallback={null}>
			<BottomSheets />
		</Suspense>
	);
};

export default BottomSheetsLazy;
