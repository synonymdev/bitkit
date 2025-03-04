import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import mmkvPlugin from 'reactotron-react-native-mmkv';
import { storage } from './src/storage';

const reactotron = Reactotron.configure()
	.use(reactotronRedux())
	.use(mmkvPlugin({ storage }))
	.useReactNative()
	.connect();

export default reactotron;
