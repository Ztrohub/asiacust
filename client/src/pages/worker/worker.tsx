import { useEffect, useState } from "react";
import { Layout } from "@/components/custom/layout";
import ThemeSwitch from "@/components/theme-switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/custom/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Copy, CalendarClockIcon, CircleCheckIcon, CircleXIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z, { set } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { handleError } from "@/hooks/error-handler";
import { useConfirm } from "@/contexts/ConfirmContext";
import api from "@/services/api";
import { IJob, JOB_STATUS } from "@/shared/types/job";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericFormat } from "react-number-format";
import { Input } from "@/components/ui/input";

const processSchema = z.object({
    status: z.string().min(1, 'Status wajib diisi'),
    price: z.number().min(0, 'Biaya tidak boleh negatif'),
    workerDescription: z.string().trim().min(1, 'Catatan wajib diisi')
});

const JobStatusBadge = ({ status }: { status: string }) => {
    switch (status.toLowerCase()) {
        case 'scheduled':
            return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"><CalendarClockIcon className="mr-1.5 h-3.5 w-3.5" /> SCHEDULED</Badge>;
        case 'done':
            return <Badge className="bg-green-600 hover:bg-green-700 text-white font-medium"><CircleCheckIcon className="mr-1.5 h-3.5 w-3.5" /> DONE</Badge>;
        case 'cancelled':
            return <Badge variant="destructive" className="font-medium"><CircleXIcon className="mr-1.5 h-3.5 w-3.5" /> CANCELLED</Badge>;
        default:
            return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
};

export default function worker() {
    const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
    
    const confirm = useConfirm();

    const handleCopyPhone = (phone: string) => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(phone)
                .then(() => toast.success("Nomor telepon disalin!"))
                .catch(() => toast.error("Gagal menyalin nomor telepon"));
        } else {
            // Fallback for non-secure contexts (like local IP testing on mobile)
            const textArea = document.createElement("textarea");
            textArea.value = phone;
            textArea.style.position = "absolute";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                toast.success("Nomor telepon disalin!");
            } catch (error) {
                toast.error("Gagal menyalin nomor telepon");
            }
            textArea.remove();
        }
    };

    const form = useForm<z.infer<typeof processSchema>>({
        resolver: zodResolver(processSchema),
        defaultValues: {
            status: '',
            price: 0,
            workerDescription: ''
        }
    });

    const [processJobId, setProcessJobId] = useState<string | null>(null);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (values: z.infer<typeof processSchema>) => {
        if (!selectedJob) return;

        if (!navigator.onLine) {
            toast.error('Tidak dapat memproses pekerjaan saat offline.');
            return;
        }

        const isConfirmed = await confirm({
            title: 'Apakah anda yakin?',
            description: 'Status pekerjaan ini akan disimpan.'
        })

        if (!isConfirmed) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.patch(`/jobs/${selectedJob._id}/process`, {
                status: values.status,
                price: values.price,
                workerDescription: values.workerDescription
            });
            toast.success("Pekerjaan berhasil diproses!");
            setProcessJobId(null);
            setSelectedJob(null);
            fetchDailyJob();
        } catch (error: any) {
            if (error.response) {
                handleError(new Error(error.response.data.message));
            } else {
                handleError(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // fetch daily job
    const [isLoading, setIsLoading] = useState(false)
    const [dailyJobs, setDailyJobs] = useState<any[]>([])
    const { user } = useAuth()

    const fetchDailyJob = async () => {
        setIsLoading(true)
        try {
            const params: { [key: string]: any } = {}

            params.page = 1
            params.limit = 10
            params.sort = 'scheduleDate'
            params['workers.firebaseUid'] = user?.uid

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            params.scheduleDate = {
                gte: today.toISOString(),
                lt: tomorrow.toISOString()
            }
            
            params.status = {
                ne: JOB_STATUS.UNSCHEDULED
            }

            const res = await api.get('/jobs', { params})

            const result = res.data.data.docs

            setDailyJobs(result)
            localStorage.setItem('cached_daily_jobs', JSON.stringify(result));

        } catch (error: any) {
            // Fallback to cache if offline OR if it's a network error (no server response)
            if (!navigator.onLine || !error.response) {
                const cached = localStorage.getItem('cached_daily_jobs');
                if (cached) setDailyJobs(JSON.parse(cached));
                toast.warning('Koneksi terputus. Data mungkin tidak terbaru.');
            } else {
                console.error('Error fetching data:', error);
                handleError(new Error('Error pengambilan data'));
                setDailyJobs([]);
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDailyJob()
    }, [])

    return (
        <Layout>
            <Layout.Header sticky>
                <div className="ml-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <UserNav />
                </div>
            </Layout.Header>
            <Layout.Body>
              <div className='-mx-4 flex-1 px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <div className='w-full overflow-x-auto pb-2 relative flex flex-col'> {/* Changed to flex-col */}
                            <h1 className='text-2xl font-bold tracking-tight mb-4'>Dashboard</h1>
                        </div>
                    </CardHeader>
                    <CardContent className='w-full min-w-0 overflow-x-auto'>
                        <div className="flex gap-2 mb-4">
                            <Button 
                                variant={activeTab === 'today' ? 'default' : 'outline'} 
                                onClick={() => setActiveTab('today')}
                            >
                                Hari Ini
                            </Button>
                            {/* <Button 
                                variant={activeTab === 'history' ? 'default' : 'outline'} 
                                onClick={() => setActiveTab('history')}
                            >
                                Lampau
                            </Button> */}
                        </div>

                        <div className="w-full">
                            <div className="flex flex-col gap-4">
                                {activeTab === 'today' ? (
                                    dailyJobs.length > 0 ? (
                                        dailyJobs.map((job) => (
                                            <Card key={job._id} className="flex flex-col sm:flex-row sm:items-center justify-between sm:pr-6">
                                                <div className="w-full">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-lg">{job.customer?.name || "Customer"}</CardTitle>
                                                        <CardDescription className="text-sm flex flex-col gap-1 mt-1">
                                                            <span>{job.customer?.address}</span>
                                                            {job.customer?.phone && (
                                                                <span 
                                                                    className="flex items-center gap-1.5 cursor-pointer text-primary hover:underline w-fit"
                                                                    onClick={() => handleCopyPhone(job.customer.phone)}
                                                                >
                                                                    {job.customer.phone} <Copy className="h-3 w-3" />
                                                                </span>
                                                            )}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                        <div className="space-y-2">
                                                            <div className="flex text-sm">
                                                                <span className="w-20 shrink-0 text-muted-foreground">Jadwal:</span>
                                                                <span className="font-medium">
                                                                    {job.scheduleDate ? new Date(job.scheduleDate).toLocaleString('id-ID', {
                                                                        dateStyle: 'medium',
                                                                        timeStyle: 'short'
                                                                    }) : '-'}
                                                                </span>
                                                            </div>
                                                            <div className="flex text-sm">
                                                                <span className="w-20 shrink-0 text-muted-foreground">Harga:</span>
                                                                <span className="font-medium">
                                                                    {job.price ? job.price.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }) : '-'}
                                                                </span>
                                                            </div>
                                                        <div className="flex items-center text-sm">
                                                                <span className="w-20 shrink-0 text-muted-foreground">Status:</span>
                                                            <JobStatusBadge status={job.status} />
                                                            </div>
                                                            <div className="flex text-sm">
                                                                <span className="w-20 shrink-0 text-muted-foreground">Pekerja:</span>
                                                                <span className="font-medium">
                                                                    {job.workers?.map((w: any) => w.username).join(', ') || '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex flex-col text-sm">
                                                                <span className="text-muted-foreground mb-1">Deskripsi:</span>
                                                                <span className="font-medium bg-muted/50 p-2 rounded-md min-h-[60px]">{job.description}</span>
                                                            </div>
                                                            <div className="flex flex-col text-sm">
                                                                <span className="text-muted-foreground mb-1">Catatan:</span>
                                                                <span className="font-medium bg-muted/50 p-2 rounded-md min-h-[60px]">{job.workerDescription || '-'}</span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </div>
                                                <div className="p-6 pt-0 sm:p-0 sm:ml-4 shrink-0">
                                                    <Dialog open={processJobId === job._id} onOpenChange={(open) => {
                                                        if (open) {
                                                            setProcessJobId(job._id);
                                                            setSelectedJob(job);
                                                            form.reset({
                                                                status: job.status === JOB_STATUS.SCHEDULED ? JOB_STATUS.DONE : job.status,
                                                                price: job.price || 0,
                                                                workerDescription: job.workerDescription || ''
                                                            });
                                                        } else {
                                                            setProcessJobId(null);
                                                            setSelectedJob(null);
                                                        }
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-600 text-black">
                                                                Process
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Selesaikan Pekerjaan</DialogTitle>
                                                                <DialogDescription>
                                                                    Silahkan isi detail pekerjaan berikut.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            
                                                            <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-md">
                                                                <div className="flex">
                                                                    <span className="w-20 shrink-0 text-muted-foreground">Customer:</span>
                                                                    <span className="font-medium">{job.customer?.name || "Customer"}</span>
                                                                </div>
                                                                <div className="flex">
                                                                    <span className="w-20 shrink-0 text-muted-foreground">Jadwal:</span>
                                                                    <span className="font-medium">
                                                                        {job.scheduleDate ? new Date(job.scheduleDate).toLocaleString('id-ID', {
                                                                            dateStyle: 'medium',
                                                                            timeStyle: 'short'
                                                                        }) : '-'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex">
                                                                    <span className="w-20 shrink-0 text-muted-foreground">Pekerja:</span>
                                                                    <span className="font-medium">
                                                                        {job.workers?.map((w: any) => w.username).join(', ') || '-'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col mt-2">
                                                                    <span className="text-muted-foreground mb-1">Deskripsi:</span>
                                                                    <span className="font-medium whitespace-pre-wrap">{job.description || '-'}</span>
                                                                </div>
                                                            </div>

                                                        <Form {...form}>
                                                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                                                                <FormField
                                                                    control={form.control}
                                                                    name="status"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Status</FormLabel>
                                                                            <Select onValueChange={field.onChange} value={field.value} >
                                                                                <FormControl>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Pilih status" />
                                                                                    </SelectTrigger>
                                                                                </FormControl>
                                                                                <SelectContent>
                                                                                    {Object.values(JOB_STATUS).filter(status => status !== JOB_STATUS.UNSCHEDULED).map((status) => (
                                                                                        <SelectItem key={status} value={status}>
                                                                                            {status.toUpperCase()}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name="price"
                                                                    render={({ field: { onChange, ...field} }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Biaya</FormLabel>
                                                                            <FormControl>
                                                                                <NumericFormat
                                                                                    {...field}
                                                                                    customInput={Input}
                                                                                    thousandSeparator={true}
                                                                                    prefix="Rp "
                                                                                    decimalScale={0}
                                                                                    allowNegative={false}
                                                                                    className="text-right"
                                                                                    onValueChange={(values) => {
                                                                                        onChange(values.floatValue || 0)
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <FormField
                                                                    control={form.control}
                                                                    name="workerDescription"
                                                                    render={({ field }) => (
                                                                        <FormItem>
                                                                            <FormLabel>Catatan</FormLabel>
                                                                            <FormControl>
                                                                                <Textarea placeholder="Masukkan catatan teknisi..." className="resize-none" rows={4} {...field} />
                                                                            </FormControl>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                                <DialogFooter className="sm:justify-between mt-4">
                                                                    <DialogClose asChild>
                                                                        <Button type="button" variant="destructive" disabled={isSubmitting}>Batal</Button>
                                                                    </DialogClose>
                                                                    <Button type="submit" loading={isSubmitting}>Simpan</Button>
                                                                </DialogFooter>
                                                            </form>
                                                        </Form>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center text-muted-foreground py-8">
                                            {isLoading ? "Memuat pekerjaan..." : "Tidak ada pekerjaan hari ini."}
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <Card className="flex flex-col sm:flex-row sm:items-center justify-between sm:pr-6">
                                            <div className="w-full">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-lg">Jane Smith</CardTitle>
                                                    <CardDescription className="text-sm flex flex-col gap-1 mt-1">
                                                        <span>Jl. Sudirman No. 8</span>
                                                        <span 
                                                            className="flex items-center gap-1.5 cursor-pointer text-primary hover:underline w-fit"
                                                            onClick={() => handleCopyPhone("089876543210")}
                                                        >
                                                            089876543210 <Copy className="h-3 w-3" />
                                                        </span>
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                    <div className="space-y-2">
                                                        <div className="flex text-sm">
                                                            <span className="w-20 shrink-0 text-muted-foreground">Jadwal:</span>
                                                            <span className="font-medium">18 April 2026</span>
                                                        </div>
                                                        <div className="flex text-sm">
                                                            <span className="w-20 shrink-0 text-muted-foreground">Harga:</span>
                                                            <span className="font-medium">Rp 300.000</span>
                                                        </div>
                                                    <div className="flex items-center text-sm">
                                                            <span className="w-20 shrink-0 text-muted-foreground">Status:</span>
                                                        <JobStatusBadge status="done" />
                                                        </div>
                                                        <div className="flex text-sm">
                                                            <span className="w-20 shrink-0 text-muted-foreground">Pekerja:</span>
                                                            <span className="font-medium">John Doe, Jane Smith</span>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex flex-col text-sm">
                                                            <span className="text-muted-foreground mb-1">Deskripsi:</span>
                                                            <span className="font-medium bg-muted/50 p-2 rounded-md min-h-[60px]">Bongkar pasang AC ke rumah baru.</span>
                                                        </div>
                                                        <div className="flex flex-col text-sm">
                                                            <span className="text-muted-foreground mb-1">Catatan:</span>
                                                            <span className="font-medium bg-muted/50 p-2 rounded-md min-h-[60px]">Sudah dipindahkan dengan aman. Pelanggan puas.</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </Card>
                                        {/* You can map over your past jobs here */}
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            </Layout.Body>
        </Layout>
    )
}