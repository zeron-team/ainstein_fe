import React from 'react'
import { createBrowserRouter } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import PrivateRoute from '@/auth/PrivateRoute'

import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import PatientsList from '@/pages/Patients/List'
import PatientForm from '@/pages/Patients/Form'
import EPCViewEdit from '@/pages/EPC/ViewEdit'
import Branding from '@/pages/Settings/Branding'
import UsersCRUD from '@/pages/Users/UsersCRUD'

const router = createBrowserRouter(
  [
    { path: '/login', element: <Login /> },
    {
      element: <AppLayout />,
      children: [
        {
          element: <PrivateRoute />,
          children: [
            { index: true, element: <Dashboard /> },
            { path: 'patients', element: <PatientsList /> },
            { path: 'patients/new', element: <PatientForm /> },
            { path: 'patients/:id/edit', element: <PatientForm /> },
            { path: 'epc/:id', element: <EPCViewEdit /> },
            { path: 'settings/branding', element: <Branding /> },
          ],
        },
        {
          element: <PrivateRoute roles={['admin']} />,
          children: [
            { path: 'admin/users', element: <UsersCRUD /> },
            { path: 'admin/patients', element: <PatientsList /> },
          ],
        },
      ],
    },
    { path: '*', element: <Login /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
)

export default router