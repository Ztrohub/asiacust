import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { USER_ROLE } from '@/shared/types/user'
import DataTable, { type DataTableRef } from 'datatables.net-react'
import DT from 'datatables.net-dt'
import 'datatables.net-responsive-dt'
import 'datatables.net-buttons'
import { IconLockPassword, IconTrash } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { handleError } from '@/hooks/error-handler'
import { CreateUserFormDialog } from './components/create-user-form-dialog'
import { useRef, useState } from 'react'
import { useConfirm } from '@/contexts/ConfirmContext'
import { toast } from 'sonner'
import { Button } from '@/components/custom/button'
import { ChangePasswordFormDialog } from './components/change-password-form-dialog'
import { isoDateFormatter } from '@/utils/iso-date-formatter'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
DataTable.use(DT)

export default function UserDashboard() {
  const { user } = useAuth();

  const dtRef = useRef<DataTableRef | null>(null)
  const confirm = useConfirm()

  // change password
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false)
  const [cpFirebaseUid, setCPFirebaseUid] = useState<string | null>(null)

  const columns = [
    { title: '', data: null, orderable: false, defaultContent: ''},
    { title: 'Username', data: 'username' },
    { title: 'Posisi', data: 'role' },
    { title: 'Status', data: 'status' },
    { title: 'Dibuat', data: 'createdAt' },
    { title: 'ID', data: 'firebaseUid', orderable: false },
    { title: '', data: null, orderable: false }
  ]

  const getUsersData = async (data: any, callback: any, settings: any) => {
    try {
      const params: { [key: string]: any } = {}

      params.page = data.start / data.length + 1
      params.limit = data.length

      if (data.order && data.order.length > 0){
        const colIndex = data.order[0].column
        const colName = columns[colIndex].data
        const direction = data.order[0].dir

        if (colName) {
          params.sort = `${direction === 'desc' ? '-' : ''}${colName}`
        }
      }

      if (data.search && data.search.value) {
        params.globalSearch = data.search.value
      }

      const res = await api.get('/users', { params })

      const result = res.data.data

      callback({
        draw: data.draw,
        recordsTotal: result.totalDocs,
        recordsFiltered: result.totalDocs,
        data: result.docs
      })
    } catch (error: any) {
      console.error('Error fetching data for DataTables:', error);
      handleError(new Error('Error pengambilan data'))
      callback({
        draw: data.draw,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: []
      })
    }
  }

  const deleteUser = async (firebaseUid: string) => {
    const isConfirmed = await confirm({
      title: 'Apakah anda yakin?',
      description: 'User ini akan dihapus secara permanen.',
      variant: 'destructive'
    })

    if (!isConfirmed) {
      return
    }

    try {
      const result = await api.delete(`/users/${firebaseUid}`)
      await reloadTable()

      toast.success(result.data.message)
    } catch (error: any) {
      handleError(error)
    }
  }
  
  const handleOpenChangePasswordDialog = (firebaseUid: string) => {
    setCPFirebaseUid(firebaseUid)
    setChangePasswordDialogOpen(true)
  }

  const reloadTable = () => {
    return new Promise<void>((resolve) => {
      const api = dtRef.current?.dt()

      if (api) {
        api.ajax.reload(resolve, false)
      } else {
        resolve()
      }
    })
  }

  return (
    <Layout>
      {/* ===== Top Heading ===== */}
      <Layout.Header sticky>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <UserNav />
        </div>
      </Layout.Header>

      <Layout.Body>
        <div className='-mx-4 flex-1 overflow-hidden px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='w-full overflow-x-auto pb-2 relative flex flex-col'> {/* Changed to flex-col */}
                <h1 className='text-2xl font-bold tracking-tight mb-4'>Users</h1>

                {/* Create Data */}
                <CreateUserFormDialog onUserCreated={reloadTable} />
                {/*                 
                <div className='flex flex-row justify-between mt-2'>
                  <Tabs
                    orientation='vertical'
                    defaultValue='overview'
                    className='space-y-4'
                  >
                    <TabsList>
                      <TabsTrigger value='overview'>Hari Ini</TabsTrigger>
                      <TabsTrigger value='analytics'>Semua</TabsTrigger>
                      <TabsTrigger value='analytics'>Belum Bayar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div> */}
              </div>
            </CardHeader>
            <CardContent className="w-full min-w-0 overflow-hidden">
              <DataTable
                ref={dtRef}
                columns={columns}
                className='display'
                options={({
                  autoWidth: false,
                  responsive: {
                    details: {
                      renderer: DT.Responsive.renderer.listHiddenNodes()
                    }
                  },
                  pageLength: 10,
                  order: [[3, 'desc']],
                  searchDelay: 500,
                  serverSide: true,
                  initComplete: function () {
                    const api = this.api()

                    const tableNode = api.table().node()
                    if (tableNode) {
                      tableNode.style.width = '100%'
                    }

                    setTimeout(() => {
                      api.columns.adjust()
                      api.responsive.recalc()
                    }, 200);
                  },
                  ajax: getUsersData
                })}
                slots={
                  { 
                    2: (data: any, row: any) => (
                      <Badge 
                        variant={data === USER_ROLE.ADMIN ? 'destructive' : 'secondary'}
                        className={data === USER_ROLE.TEKNISI ? 'bg-blue-500 text-white dark:bg-blue-600' : ''}
                      >
                        {data.toUpperCase()}
                      </Badge>
                    ),
                    3: (data: any, row: any) => (
                      <Badge
                        variant={data ? 'default' : 'destructive'}
                      >
                        {data ? 'Aktif' : 'Non-aktif'}
                      </Badge>
                    ),
                    4: (data: string, row: any) => (
                      <span> { isoDateFormatter(data) }</span>
                    ),
                    6: (data: any, row: any) => (
                      // <div className="flex items-center gap-2">
                      //   <Button 
                      //     variant='destructive' 
                      //     size='sm' 
                      //     disabled={data.firebaseUid === user?.uid || !data.status}
                      //     onClick={async () => deleteUser(data.firebaseUid)}>
                      //     <IconTrash /> Hapus
                      //   </Button>
                      //   <Button 
                      //     variant='default' 
                      //     size='sm'
                      //     disabled={!data.status}
                      //     onClick={async () => handleOpenChangePasswordDialog(data.firebaseUid)}>
                      //     <IconLockPassword /> Ganti Password
                      //   </Button>
                      // </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <span className='sr-only'>Open Menu</span>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem 
                            onClick={() => handleOpenChangePasswordDialog(data.firebaseUid)}
                            disabled={data.firebaseUid === user?.uid || !data.status}
                          >
                            <IconLockPassword className="mr-2 h-4 w-4" /> Ganti Password
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => deleteUser(row._id)}
                            disabled={!data.status}
                          >
                            <Trash className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>

                        </DropdownMenuContent>                        
                      </DropdownMenu>
                    )
                  }
                }
              />
            </CardContent>
          </Card>

          <ChangePasswordFormDialog
            isDialogOpen={changePasswordDialogOpen}
            onOpenChange={(open) => {
              setChangePasswordDialogOpen(open)
              
              if (!open) {
                setCPFirebaseUid(null)
              }
            }}
            firebaseUid={cpFirebaseUid}
          />
        </div>
      </Layout.Body>
    </Layout >
  )
}
