import {
  IconLayoutDashboard,
  IconUsers,
} from '@tabler/icons-react'
import type { JSX } from 'react'

export interface NavLink {
  title: string
  label?: string
  href: string
  icon: JSX.Element
}

export interface SideLink extends NavLink {
  sub?: NavLink[]
}

export const adminlinks: SideLink[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: <IconLayoutDashboard size={18} />,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: <IconUsers size={18} />,
  }
]

export const workerlinks: SideLink[] = [
  {
    title: 'Dashboard',
    href: '/worker',
    icon: <IconLayoutDashboard size={18} />,
  }
]
