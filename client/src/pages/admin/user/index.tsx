import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { USER_ROLE } from '@/shared/types/user'
import DataTable from 'datatables.net-react'
import DT from 'datatables.net-dt'
import 'datatables.net-responsive-dt'
import 'datatables.net-buttons'
import { Button } from '@/components/ui/button'
import { IconTrash } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import api from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
// import { CreateDialogPekerja } from './components/create-dialog-pekerja'
DataTable.use(DT)

export default function UserDashboard() {
  const { user } = useAuth();

  const columns = [
    { title: 'Username', data: 'username' },
    { title: 'Posisi', data: 'role' },
    { title: 'ID', data: 'firebaseUid', orderable: false },
    { title: 'Hapus', data: null, orderable: false }
  ]

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
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='w-full overflow-x-auto pb-2 relative flex flex-col'> {/* Changed to flex-col */}
                <h1 className='text-2xl font-bold tracking-tight mb-4'>Users</h1>

                {/* Create Data */}
                {/* <CreateDialogPekerja /> */}
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
            <CardContent>
              <DataTable
                columns={columns}
                className='display'
                options={({
                  responsive: {
                    details: {
                      renderer: DT.Responsive.renderer.listHiddenNodes()
                    }
                  },
                  pageLength: 10,
                  order: [[1, 'asc']],
                  searchDelay: 500,
                  serverSide: true,
                  ajax: async (data: any, callback: any, settings: any) => {
                    try {
                      const params: { [key: string]: any } = {}

                      params.page = data.start / data.length + 1
                      params.limit = data.length

                      if (data.order && data.order.length > 0){
                        const colIndex = data.order[0].column
                        const colName = columns[colIndex].data
                        const direction = data.order[0].dir

                        if (colName) {
                          params.sort = `${colName}:${direction}`
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
                      callback({
                        draw: data.draw,
                        recordsTotal: 0,
                        recordsFiltered: 0,
                        data: [],
                        error: error.message || 'Error pengambilan data' 
                      })
                    }
                  }
                })}
                slots={
                  { 
                    1: (data: any, row: any) => (
                      <Badge 
                        variant={data === USER_ROLE.ADMIN ? 'destructive' : 'secondary'}
                        className={data === USER_ROLE.TEKNISI ? 'bg-blue-500 text-white dark:bg-blue-600' : ''}
                      >
                        {data.toUpperCase()}
                      </Badge>
                    ),
                    3: (data: any, row: any) => (
                      <Button 
                        variant='destructive' 
                        size='icon' 
                        disabled={data.firebaseUid === user?.uid}
                        onClick={() => console.log('Delete', data.firebaseUid)}>
                        <IconTrash />
                      </Button>
                    )
                  }
                }
              />
            </CardContent>
          </Card>
        </div>
      </Layout.Body>
    </Layout >
  )
}
