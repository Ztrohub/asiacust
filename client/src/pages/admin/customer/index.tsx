import { Layout } from '@/components/custom/layout'
import ThemeSwitch from '@/components/theme-switch'
import { UserNav } from '@/components/user-nav'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import DataTable, { type DataTableRef } from 'datatables.net-react'
import DT from 'datatables.net-dt'
import 'datatables.net-responsive-dt'
import 'datatables.net-buttons'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import api from '@/services/api'
import { handleError } from '@/hooks/error-handler'
import { useRef, useState } from 'react'
import { useConfirm } from '@/contexts/ConfirmContext'
import { toast } from 'sonner'
import { Button } from '@/components/custom/button'
import { isoDateFormatter } from '@/utils/iso-date-formatter'
import { CreateCustomerFormDialog } from './components/create-customer-form-dialog'
import { ICustomer } from '@/shared/types/customer'
import { EditCustomerFormDialog } from './components/edit-customer-form-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
DataTable.use(DT)

export default function CustomerDashboard() {

  const dtRef = useRef<DataTableRef | null>(null)
  const confirm = useConfirm()
  
    // edit customer
    const [editCustomerDialogOpen, setEditCustomerDialogOpen] = useState(false)
    const [editCustomer, setEditCustomer] = useState<ICustomer | null>(null)

  const columns = [
    { title: '', data: null, className: 'all', orderable: false, defaultContent: ''},
    { title: 'Nama', className: 'all', data: 'name' },
    { title: 'Alamat', data: 'address', orderable: false },
    { title: 'Telpon', data: 'phone', orderable: false },
    { title: 'Dibuat', data: 'createdAt' },
    { title: '', data: null, className: 'all', orderable: false }
  ]

  const getCustomersData = async (data: any, callback: any, settings: any) => {
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

      const res = await api.get('/customers', { params })

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

  const deleteCustomer = async (_id: string) => {
    const isConfirmed = await confirm({
      title: 'Apakah anda yakin?',
      description: 'Customer ini akan dihapus secara permanen.',
      variant: 'destructive'
    })

    if (!isConfirmed) {
      return
    }

    try {
      const result = await api.delete(`/customers/${_id}`)
      await reloadTable()

      toast.success(result.data.message)
    } catch (error: any) {
      handleError(error)
    }
  }

  const handleOpenEditCustomerDialog = (customer: ICustomer) => {
    setEditCustomer(customer)
    setEditCustomerDialogOpen(true)
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
        <div className='-mx-4 flex-1 px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <div className='w-full overflow-x-auto pb-2 relative flex flex-col'> {/* Changed to flex-col */}
                <h1 className='text-2xl font-bold tracking-tight mb-4'>Customers</h1>

                {/* Create Data */}
                <CreateCustomerFormDialog onCustomerCreated={reloadTable} />
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
                    }, 300);
                  },
                  ajax: getCustomersData
                })}
                slots={
                  { 
                    4: (data: string, row: any) => (
                        <span> { isoDateFormatter(data) }</span>
                    ),
                    5: (data: any, row: any) => (
                      // <div className="flex items-center gap-2">
                      //   <Button 
                      //     variant='destructive' 
                      //     size='sm' 
                      //     onClick={async () => deleteCustomer(row._id)}>
                      //     <IconTrash /> Hapus
                      //   </Button>
                      //   <Button 
                      //     variant='default' 
                      //     size='sm'
                      //     onClick={async () => handleOpenEditCustomerDialog({
                      //       _id: row._id,
                      //       name: row.name,
                      //       address: row.address,
                      //       phone: row.phone,
                      //     })}>
                      //     <IconPencil /> Edit
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
                          <DropdownMenuItem onClick={() => handleOpenEditCustomerDialog({
                              _id: row._id,
                              name: row.name,
                              address: row.address,
                              phone: row.phone,
                            })}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => deleteCustomer(row._id)}>
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
          
          <EditCustomerFormDialog
            customer={editCustomer}
            isDialogOpen={editCustomerDialogOpen}
            onOpenChange={setEditCustomerDialogOpen}
            onCustomerEdited={reloadTable}
          />
        </div>
      </Layout.Body>
    </Layout >
  )
}
