import './App.css';
import { Designer } from './components/Designer';
import { PermissionProvider } from './contexts/PermissionContext';

function App() {
  return (
    <PermissionProvider>
      <Designer />
    </PermissionProvider>
  );
}

export default App;
