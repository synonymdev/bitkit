import React, { ReactElement, useContext, useEffect, useState } from 'react';
// @ts-ignore
import { SDK } from '@synonymdev/slashtags-sdk/dist/rn.js';
import type { SDK as ISDK } from '@synonymdev/slashtags-sdk/types/src/index';
import { createContext } from 'react';
import { storage as mmkv } from '../store/mmkv-storage';
import RAWSFactory from 'random-access-web-storage';

const RAWS = RAWSFactory({
	setItem: (key, value) => {
		mmkv.set(key, value);
	},
	getItem: (key) => {
		return mmkv.getString(key);
	},
	removeItem: (key) => {
		mmkv.delete(key);
	},
});

export const clearSlashtagsStorage = (): void => {
	const keys = mmkv.getAllKeys();
	for (let key of keys) {
		key.startsWith('core') && mmkv.delete(key);
	}
};

export interface ISlashtagsContext {
	sdk?: ISDK;
}

export const SlashtagsContext = createContext<ISlashtagsContext>({});

export const SlashtagsProvider = ({
	primaryKey,
	onError,
	children,
}: {
	primaryKey: Buffer | null | Promise<Buffer | null>;
	onError: (error: Error) => void;
	children: ReactElement[];
}): JSX.Element => {
	const [state, setState] = useState<Partial<ISlashtagsContext>>({});

	useEffect(() => {
		(async (): Promise<undefined | (() => void)> => {
			if (!primaryKey) {
				return;
			}

			try {
				const sdk = await (SDK as typeof ISDK).init({
					primaryKey: (await primaryKey) as Uint8Array,
					// TODO: replace it with random access react native after m1 support
					storage: RAWS,
					// TODO: replace hardcoded relays with configurable relays
					swarmOpts: { relays: ['ws://167.86.102.121:45475'] },
				});

				setState({ sdk });
			} catch (error) {
				onError(error as Error);
			}
		})();
	}, [primaryKey, onError]);

	return (
		<SlashtagsContext.Provider value={state}>
			{children}
		</SlashtagsContext.Provider>
	);
};

export const useSlashtags = (): ISlashtagsContext => {
	const context = useContext(SlashtagsContext);
	return context;
};
