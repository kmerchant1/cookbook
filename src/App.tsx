import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './state/AppContext'
import { PhoneFrame } from './components/PhoneFrame'
import { RecipesScreen } from './screens/RecipesScreen'
import { RecipeDetailScreen } from './screens/RecipeDetailScreen'
import { AddRecipeScreen } from './screens/AddRecipeScreen'
import { CookScreen } from './screens/CookScreen'
import { CookListScreen } from './screens/CookListScreen'
import { GroceryScreen } from './screens/GroceryScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import './app.css'

// HashRouter keeps deep links working under the file:// scheme inside the
// Capacitor native shell as well as on the web.
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <PhoneFrame>
          <Routes>
            <Route path="/" element={<Navigate to="/recipes" replace />} />
            <Route path="/recipes" element={<RecipesScreen />} />
            <Route path="/recipes/:id" element={<RecipeDetailScreen />} />
            <Route path="/add" element={<AddRecipeScreen />} />
            <Route path="/add/:id" element={<AddRecipeScreen />} />
            <Route path="/cook" element={<CookScreen />} />
            <Route path="/cook/list" element={<CookListScreen />} />
            <Route path="/grocery" element={<GroceryScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/recipes" replace />} />
          </Routes>
        </PhoneFrame>
      </HashRouter>
    </AppProvider>
  )
}
