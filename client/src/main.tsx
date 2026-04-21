import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@/index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import router from './router'
import { AuthProvider } from './contexts/AuthContext'
import { NetworkListener } from './components/network-listener'
import { initGlobalErrorHandler } from './hooks/error-handler'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { ConfirmDialog } from './components/custom/confirm-dialog'

initGlobalErrorHandler()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
      <AuthProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
          <Toaster />
          <NetworkListener />
          <ConfirmDialog />
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
