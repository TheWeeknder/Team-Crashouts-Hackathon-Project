import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

// daisyUI switches to the dark theme via prefers-color-scheme. FullCalendar's
// Monarch palette needs a data-color-scheme attribute instead, so mirror it.
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
const syncColorScheme = () => {
  document.documentElement.dataset.colorScheme = darkQuery.matches ? 'dark' : 'light'
}
syncColorScheme()
darkQuery.addEventListener('change', syncColorScheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
