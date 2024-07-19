import { shallowEqual } from 'react-redux';
import { createSelectorCreator, lruMemoize } from '@reduxjs/toolkit';
import { RootState } from '..';

export const createShallowEqualSelector = createSelectorCreator(
	lruMemoize,
	shallowEqual,
).withTypes<RootState>();
