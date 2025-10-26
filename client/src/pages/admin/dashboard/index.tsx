import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/custom/button'
// import DataTable from 'datatables.net-react';
// import DT from 'datatables.net-dt';
// import 'datatables.net-responsive-dt';
// import 'datatables.net-buttons';
import { useState } from 'react'
// import { CreateDialogPekerjaan } from './components/create-dialog-pekerjaan'
// DataTable.use(DT)

export default function Dashboard() {
  const [tableData, setTableData] = useState([
    ['Test1', 'Test2', 'Test3', 'Test4', 'Test5', 'Test6', 'testid', 'test7', 'test8', 'test9'],
    ['Test11', 'Test12', 'Test13', 'Test14', 'Test15', 'Test16', 'testid', 'test17', 'test18', 'test19']
  ]);

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
                <h1 className='text-2xl font-bold tracking-tight mb-4'>Pekerjaan</h1>
                
                {/* Create Data */}
                {/* <CreateDialogPekerjaan/> */}
                
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* <DataTable
                data={tableData}
                className="display"
                options={{
                  
                  responsive: {
                    details: {
                      renderer: DT.Responsive.renderer.listHiddenNodes()
                    },
                  },
                  pageLength: 50,
                }
                }
                slots={{
                  6: (data, row) => (
                    <Button>
                      Click me!
                    </Button>
                  )
                }}
              >
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Alamat</th>
                    <th>No Telp</th>
                    <th>Keterangan</th>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Pekerja</th>
                    <th>Biaya</th>
                    <th>Status Kerja</th>
                    <th>Status Bayar</th>
                  </tr>

                </thead>
              </DataTable> */}
            </CardContent>
          </Card>
        </div>
      </Layout.Body>
    </Layout >
  )
}
