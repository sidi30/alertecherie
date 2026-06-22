import { registerRootComponent } from 'expo';
import App from './App';

// Point d'entrée. registerRootComponent appelle AppRegistry.registerComponent
// et garantit le bon environnement (Expo Go ou dev build).
registerRootComponent(App);
