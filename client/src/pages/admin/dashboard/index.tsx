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
import { useMemo, useRef, useState } from 'react'
import { useConfirm } from '@/contexts/ConfirmContext'
import { Button } from '@/components/custom/button'
import { isoDateFormatter } from '@/utils/iso-date-formatter'
import { CreateJobFormDialog } from './components/create-job-form-dialog'
import worker from '@/pages/worker/worker'
import { Badge } from '@/components/ui/badge'
import { USER_ROLE } from '@/shared/types/user'
import { IJob, JOB_STATUS } from '@/shared/types/job'
import { CalendarClockIcon, CalendarOffIcon, CheckCircle, CheckIcon, CircleCheckIcon, CircleXIcon, MoreHorizontal, Pencil, Trash, XCircle, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EditJobFormDialog } from './components/edit-job-form-dialog'
DataTable.use(DT)

const statusConfig = {
  [JOB_STATUS.UNSCHEDULED]: {
    variant: "default",
    icon: CalendarOffIcon,
    label: "Unscheduled",
    className: "bg-yellow-500 text-black"
  },
  [JOB_STATUS.SCHEDULED]: {
    variant: "secondary",
    icon: CalendarClockIcon,
    label: "Scheduled",
    className: ""
  },
  [JOB_STATUS.CANCELLED]: {
    variant: "destructive",
    icon: CircleXIcon,
    label: "Cancelled",
    className: ""
  },
  [JOB_STATUS.DONE]: { 
    variant: "default",
    icon: CircleCheckIcon,
    label: "Done",
    className: "bg-green-600 text-white"
  },
} as const;

export default function Dashboard() {

  const dtRef = useRef<DataTableRef | null>(null)
  const confirm = useConfirm()

  const [refreshKey, setRefreshKey] = useState(0)
  
    // edit customer
    const [editJobDialogOpen, setEditJobDialogOpen] = useState(false)
    const [editJob, setEditJob] = useState<IJob | null>(null)

  const columns = useMemo(() => 
    [
      { title: '', data: null, orderable: false, defaultContent: '', className: 'dtr-control all', responsivePriority: 0},
      { title: 'Pekerja', data: null, className: 'all min-w-[120px]', responsivePriority: 1, orderable: false },
      { title: 'Customer', data: 'customer.name', className: 'all min-w-[120px]', responsivePriority: 2 },
      { title: 'Alamat', data: 'customer.address', responsivePriority: 10, orderable: false },
      { title: 'Telpon', data: 'customer.phone', responsivePriority: 10, orderable: false },
      { title: 'Deskripsi', data: 'description', responsivePriority: 10, orderable: false },
      { title: 'Jadwal', data: null, responsivePriority: 10 },
      { title: 'Biaya', data: 'price', responsivePriority: 10 },
      { title: 'Status', data: 'status', responsivePriority: 10 },
      { title: 'Dibuat', data: 'createdAt', responsivePriority: 10},
      { title: '', data: null, className: 'all text-right', responsivePriority: 3, orderable: false }
  ], [])

  const getJobData = async (data: any, callback: any, settings: any) => {
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

      const res = await api.get('/jobs', { params })

      const result = res.data.data

      console.log(result)

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

  const deleteJob = async (_id: string) => {
    const isConfirmed = await confirm({
      title: 'Apakah anda yakin?',
      description: 'Pekerjaan ini akan dihapus secara permanen.'
    })

    if (!isConfirmed) {
      return
    }

    try {
      const result = await api.delete(`/jobs/${_id}`)
      await reloadTable()

      toast.success(result.data.message)
    } catch (error: any) {
      handleError(error)
    }
  }

  const changeStatusJob = async (_id: string, status: JOB_STATUS) => {
    const isConfirmed = await confirm({
      title: 'Apakah anda yakin?',
      description: 'Status pekerjaan ini akan diubah'
    })

    if (!isConfirmed) {
      return
    }

    try {
      const result = await api.patch(`/jobs/${_id}/status`, {
        status
      })

      await reloadTable()
      toast.success(result.data.message)
    } catch (error: any) {
      handleError(error)
    }
  }

  const handleOpenEditJobDialog = (job: IJob) => {
    setEditJob(job)
    setEditJobDialogOpen(true)
  }

  const reloadTable = () => {
    return new Promise<void>((resolve) => {
      // const api = dtRef.current?.dt()

      // if (api) {
      //   api.ajax.reload(() => {
      //     // const tableNode = api.table().node()
      //     // if (tableNode) {
      //     //   tableNode.style.width = '100%'
      //     // }

      //     // api.columns.adjust()
      //     // api.responsive.recalc()
      //     window.dispatchEvent(new Event('resize'))
      //     resolve()
      //   }, false)
      // } else {
      //   resolve()
      // }
      setRefreshKey(prev => prev + 1)
      resolve()
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
                <h1 className='text-2xl font-bold tracking-tight mb-4'>Dashboard</h1>

                {/* Create Data */}
                <CreateJobFormDialog onJobCreated={reloadTable} />
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
            <CardContent className='w-full min-w-0 overflow-x-auto'>
              <DataTable
                key={refreshKey}
                ref={dtRef}
                columns={columns}
                className='display'
                options={({
                  stateSave: true,
                  autoWidth: false,
                  responsive: {
                    details: {
                      renderer: DT.Responsive.renderer.listHiddenNodes()
                    }
                  },
                  pageLength: 10,
                  order: [[9, 'desc']],
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
                  // drawCallback: function () {
                  //   // Fungsi ini berjalan setiap kali tabel selesai digambar (load, sort, page, delete)
                  //   const api = this.api();
                    
                  //   // Memaksa kalkulasi ulang kolom dan responsivitas
                  //   requestAnimationFrame(() => {
                  //       api.columns.adjust();
                  //       api.responsive.recalc();
                  //   });
                  // },
                  ajax: getJobData
                })}
                slots={
                  { 
                    1: (data: any, row: any) => (
                      <div className="flex items-center gap-2">
                        {row.workers?.map((worker: any) => (
                          <Badge key={worker.firebaseUid} variant='secondary' className={'text-sm px-3 py-1 ' + (worker.role === USER_ROLE.TEKNISI ? 'bg-blue-500 text-white dark:bg-blue-600' : '')}>
                            {worker.username}
                          </Badge>
                        ))}
                      </div>
                    ),
                    6: (data: any, row: any) => (
                      <span> { row.scheduleDate ? isoDateFormatter(row.scheduleDate) : '-' }</span>
                    ),
                    7: (data: any, row: any) => (
                      <span> { row.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) } </span>
                    ),
                    8: (data: string, row: any) => {
                      const config = statusConfig[data as keyof typeof statusConfig] || statusConfig[JOB_STATUS.DONE]
                      const Icon = config.icon

                      return (
                        <Badge 
                        variant={config.variant} 
                        className={`text-sm ${config.className}`}
                        >
                          <Icon className='mr-2 h-4 w-4' />
                          {data.toUpperCase()} 
                        </Badge>
                      )
                    },
                    9: (data: string, row: any) => (
                      <span> { isoDateFormatter(data) } </span>
                    ),
                    10: (data: any, row: any) => (
                      // <div className="flex items-center gap-2">
                      //   <Button 
                      //     variant='destructive' 
                      //     size='sm' 
                      //     onClick={async () => deleteJob(row._id)}>
                      //     <IconTrash /> Hapus
                      //   </Button>
                      //   <Button 
                      //     variant='default' 
                      //     size='sm'
                      //     onClick={async () => console.log('edit')}>
                      //     <IconPencil /> Edit
                      //   </Button>
                      //   <Button
                      //     variant='default'
                      //     size='icon'
                      //     className={cn(
                      //       'bg-green-600 hover:bg-green-700 text-white',
                      //       row.status !== JOB_STATUS.SCHEDULED && 'hidden'
                      //     )}
                      //     onClick={async () => changeStatusJob(row._id, JOB_STATUS.DONE)}>
                      //       <CheckIcon />
                      //   </Button>
                      //   <Button
                      //     variant='destructive'
                      //     size='icon'
                      //     className={cn(
                      //       'bg-yellow-500 hover:bg-yellow-600 text-black',
                      //       row.status !== JOB_STATUS.SCHEDULED && 'hidden'
                      //     )}
                      //     onClick={async () => changeStatusJob(row._id, JOB_STATUS.CANCELLED)}>
                      //       <XIcon />
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
                          <DropdownMenuItem onClick={() => handleOpenEditJobDialog({
                            _id: row._id,
                            customer: row.customer._id,
                            description: row.description,
                            scheduleDate: row.scheduleDate,
                            price: row.price,
                            workers: row.workers?.map((worker: any) => worker.firebaseUid) || [],
                            status: row.status,
                            workerDescription: row.workerDescription,
                            startDate: row.startDate,
                            endDate: row.endDate,
                            paymentDate: row.paymentDate,
                            paymentStatus: row.paymentStatus,
                          })}>

                          {/* <DropdownMenuItem onClick={() => console.log(row)}> */}
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => deleteJob(row._id)}>
                            <Trash className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>

                          {row.status === JOB_STATUS.SCHEDULED && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className='text-sm' > Update status </DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => changeStatusJob(row._id, JOB_STATUS.DONE)}>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Selesai
                              </DropdownMenuItem>
                            </>
                          )}

                          {row.status !== JOB_STATUS.DONE && row.status !== JOB_STATUS.CANCELLED && (
                            <>
                            <DropdownMenuItem onClick={() => changeStatusJob(row._id, JOB_STATUS.CANCELLED)}>
                              <XCircle className="mr-2 h-4 w-4 text-yellow-600" /> Batal
                            </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>                        
                      </DropdownMenu>
                    )
                  }
                }
              />
            </CardContent>
          </Card>
          
          <EditJobFormDialog
            job={editJob}
            isDialogOpen={editJobDialogOpen}
            onOpenChange={setEditJobDialogOpen}
            onJobEdited={reloadTable}
          />
        </div>
      </Layout.Body>
    </Layout >
  )
}
