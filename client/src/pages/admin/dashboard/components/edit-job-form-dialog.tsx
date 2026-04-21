import { Button } from "@/components/custom/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/contexts/ConfirmContext";
import { handleError } from "@/hooks/error-handler";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import { ICustomer } from "@/shared/types/customer";
import { IJob, JOB_STATUS } from "@/shared/types/job";
import { IUser, USER_ROLE } from "@/shared/types/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import z from "zod";

const editSchema = z.object({
	customer: z.object({
        _id: z.string().optional(),
        name: z.string().trim().min(1, 'Nama wajib diisi'),
        address: z.string().trim().min(1, 'Alamat wajib diisi'),
        phone: z.string().trim().optional()
    }),
	description: z.string().trim().min(1, 'Deskripsi wajib diisi'),
	// scheduleDate: z.coerce.date().optional(),
	scheduleDate: z.date().optional(),
	price: z.number().optional(),
	workers: z.array(z.string()).optional(),
	status: z
		.enum(JOB_STATUS, {
			message: `Status harus salah satu dari: ${Object.values(JOB_STATUS).join(', ')}`
		})
		.optional()
});

interface EditJobFormDialogProps {
    job: IJob | null;
	isDialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
	onJobEdited: () => Promise<void>;
}

export function EditJobFormDialog({ job, isDialogOpen, onOpenChange, onJobEdited }: EditJobFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false)

	const confirm = useConfirm()

	// hardware back close dialog
	const isBackEvent = useRef(false)

	useEffect(() => {
		if (isDialogOpen) {
			window.history.pushState({dialogOpen: true}, '', window.location.href)

			const onPopState = (event: PopStateEvent) => {
				if (event.state?.dialogOpen === true) {
					return
				}

				isBackEvent.current = true
				onOpenChange(false)
			}

			window.addEventListener('popstate', onPopState)

			return () => {
				if (!isBackEvent.current) {
					window.history.back()
				}

				isBackEvent.current = false
			}
		}
	}, [isDialogOpen, onOpenChange])

    // search customer
    const [openCombobox, setOpenCombobox] = useState(false)
	const [query, setQuery] = useState('')
	const [searchResults, setSearchResults] = useState<ICustomer[]>([])
	const [isSearching, setIsSearching] = useState(false)
	const [isNewMode, setIsNewMode] = useState(true)
	
	const debounceQuery = useDebounce(query, 500)

	useEffect(() => {
		const fetchCustomer = async () => {
			setIsSearching(true)
			try {
				const params: { [key: string]: any } = {}

				params.page = 1
				params.limit = 10
				params.sort = 'name'
				if (debounceQuery)
					params.globalSearch = debounceQuery

				const res = await api.get('/customers', { params })

				const result = res.data.data.docs

				setSearchResults(result)
			} catch (error: any) {
				console.error('Error fetching data:', error);
				handleError(new Error('Error pengambilan data'))
				setSearchResults([])
			} finally {
				setIsSearching(false)
			}
		}

		fetchCustomer()
	}, [debounceQuery])

    const handleSelectExisting = (customer: ICustomer) => {
		form.setValue('customer._id', customer._id)
		form.setValue('customer.name', customer.name)
		form.setValue('customer.address', customer.address)
		form.setValue('customer.phone', customer.phone || undefined)

		setIsNewMode(false)
		setOpenCombobox(false)

		setQuery(customer.name)
	}

    const handleCreateNew = () => {
		form.setValue('customer._id', '')
		form.setValue('customer.name', query)
		form.setValue('customer.address', '')
		form.setValue('customer.phone', '')

		setIsNewMode(true)
		setOpenCombobox(false)
	}

	// date-picker
	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			form.setValue('scheduleDate', date)
		}
	}

	const handleTimeChange = (type: 'hour' | 'minute', value: string) => {
		const currentDate = form.getValues('scheduleDate') || new Date()
		let newDate = new Date(currentDate)

		if (type === 'hour') {
			newDate.setHours(parseInt(value, 10))
		} else if (type === 'minute') {
			newDate.setMinutes(parseInt(value, 10))
		}

		form.setValue('scheduleDate', newDate)
	}

	// worker-picker
	const [workerList, setWorkerList] = useState<IUser[]>([])
	const [isWorkersLoading, setIsWorkersLoading] = useState(false)

	useEffect(() => {
		const fetchWorkers = async () => {
			setIsWorkersLoading(true)
			try {
				const params: { [key: string]: any } = {}

				params.page = 1
				params.limit = 100
				params.sort = 'username'
				params.role = {
					in: [USER_ROLE.TEKNISI, USER_ROLE.HELPER].join(',')
				}
				params.status = true

				const res = await api.get('/users', { params })

				const result = res.data.data.docs

				setWorkerList(result)

			} catch (error: any) {
				console.error('Error fetching data:', error);
				handleError(new Error('Error pengambilan data'))
				setWorkerList([])
			} finally {
				setIsWorkersLoading(false)
			}
		}

		fetchWorkers()
	}, [])

	// form
	const form = useForm<z.infer<typeof editSchema>>({
		resolver: zodResolver(editSchema),
		defaultValues: {
            customer: {
                _id: '',
                name: '',
                address: '',
                phone: ''
            },
            description: '',
            scheduleDate: undefined,
            price: 0,
            workers: [],
            status: JOB_STATUS.UNSCHEDULED
		}
	});

	useEffect(() => {
        const fetchCustomer = async (_id: string) => {
            setIsSearching(true)
            try {
                const params: { [key: string]: any } = {}

                params.page = 1
                params.limit = 1
                params._id = _id

                const res = await api.get('/customers', { params })

                const result = res.data.data.docs
				console.log(result)

                if (result.length > 0) {
                    handleSelectExisting(result[0])
                } else {
                    console.error('Customer tidak ditemukan')
                    toast.error('Terjadi kesalahan')
                    onOpenChange(false)
                }
            } catch (error: any) {
                console.error('Error fetching data:', error);
                handleError(new Error('Error pengambilan data'))
                onOpenChange(false)
            } finally {
                setIsSearching(false)
            }
        }

		if (isDialogOpen){
			if (job) {
                if (job.customer) {
                    fetchCustomer(job.customer)

					form.setValue('description', job.description)
					form.setValue('scheduleDate', job.scheduleDate ? new Date(job.scheduleDate) : undefined)
					form.setValue('price', job.price)
					form.setValue('workers', job.workers)
					form.setValue('status', job.status)
                } else {
                    console.error('Customer tidak ditemukan')
                    toast.error('Terjadi kesalahan')
                    onOpenChange(false)
                }
			} else {
				console.error('Pekerjaan tidak ditemukan')
				toast.error('Terjadi kesalahan')
				onOpenChange(false)
			}
		} else {
			form.reset()
		}
	}, [isDialogOpen, form])

	const onSubmit = async (values: z.infer<typeof editSchema>) => {
		setIsLoading(true)

		const isConfirmed = await confirm({
			title: 'Apakah anda yakin?',
			description: 'Pekerjaan ini akan diubah.'
		})

		if (!isConfirmed) {
			setIsLoading(false)
			return
		}

		try {
			if (values.customer._id === '')  {
				const res = await api.post('/customers', {
					name: values.customer.name,
					address: values.customer.address,
					phone: values.customer.phone
				})

				values.customer._id = res.data.data._id
			}

			const result = await api.patch(`/jobs/${job?._id}`, {
				customer: values.customer._id,
				description: values.description,
				scheduleDate: values.scheduleDate,
				price: values.price,
				workers: values.workers,
				status: values.status
			})

			toast.success(result.data.message)
			await onJobEdited()

			onOpenChange(false)
		} catch (error: any) {
			if (error.response) {
				handleError(new Error(error.response.data.message))
			} else {
				handleError(error)
			}
		} finally {
			setIsLoading(false)
		}
	}

	return (
        <Dialog
			open={isDialogOpen}
			onOpenChange={onOpenChange}
		>
            <DialogContent className="sm:max-w-md overflow-y-auto max-h-[80vh]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>Edit Pekerjaan</DialogTitle>
                            <DialogDescription>Silahkan isi sesuai dengan kolom yang telah diberikan.</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="customer.name"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Nama<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <Popover modal open={openCombobox} onOpenChange={setOpenCombobox}>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant='outline'
													role="combobox"
													aria-expanded={openCombobox}
													className={cn(
														"w-full justify-between",
														!field.value && "text-muted-foreground"
													)}
												>
													{field.value || "Cari atau buat customer baru..."}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent  
											className="w-[var(--radix-popover-trigger-width)] p-0"
											onOpenAutoFocus={(e) => e.preventDefault()}
										>
											<Command shouldFilter={false}>
												<CommandInput
													placeholder="Ketik nama customer..."
													value={query}
													onValueChange={setQuery}
												/>
												<CommandList>
													{isSearching && (
														<div className="flex item-center justify-center p-4 text-muted-foreground">
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
															<span>Loading...</span>
														</div>
													)}

													{!isSearching && (
														<>
															{query.length > 0 && (
																<CommandGroup>
																	<CommandItem
																		value="CREATE_NEW_TRIGGER"
																		onSelect={handleCreateNew}
																		className="text-blue-600 font-medium cursor-pointer"
																	>
																		<Plus className="mr-2 h-4 w-4" />
																		Buat Baru: "{query}"
																	</CommandItem>
																</CommandGroup>
															)}

															<CommandSeparator />

															<CommandGroup heading="Hasil Pencarian">
																{searchResults.map((customer) => (
																	<CommandItem
																		key={customer._id}
																		value={customer.name}
																		onSelect={() => handleSelectExisting(customer)}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				customer.name === field.value ? "opacity-100" : "opacity-0"
																			)}
																		/>
																		<div className="flex flex-col">
																			<span className="font-medium">{customer.name}</span>
																			<span className="text-xs text-muted-foreground">
																				{customer.address}
																			</span>
																		</div>
																	</CommandItem>
																))}
																{searchResults.length === 0 && query.length > 0 && (
																	<div className="py-2 text-center text-xs text-muted-foreground">
																		Tidak ditemukan.
																	</div>
																)}
															</CommandGroup>
														</>
													)}
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
						<FormField
							control={form.control}
							name="customer.address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Alamat<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
									<FormControl>
										<Textarea 
											placeholder="Alamat Customer" 
											{...field}
											disabled={!isNewMode}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
                        <FormField
                            control={form.control}
                            name="customer.phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telepon</FormLabel>
                                    <FormControl>
                                        <Input 
											placeholder="No Telepon Customer" 
											{...field}
											disabled={!isNewMode}
											type="number"
										/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

						<Separator />

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Deskripsi<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
									<FormControl>
										<Textarea placeholder="Deskripsi Pekerjaan" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="scheduleDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Jadwal</FormLabel>
									<Popover modal>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant='outline'
													className={cn(
														"w-full pl-3 text-left font-normal",
														!field.value && "text-muted-foreground"
													)}
												>
													{field.value ? (
														format(field.value, 'dd/MM/yyyy HH:mm')
													) : (
														<span>Pilih Tanggal dan waktu</span>
													)}
													<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0">
											<div className="sm:flex">
												<Calendar
													mode="single"
													selected={field.value}
													onSelect={handleDateSelect}
												/>
												<div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x border-t sm:border-t-0 sm:border-l">
													<ScrollArea className="w-64 sm:w-auto">
														<div className="flex sm:flex-col p-2">
															{Array.from({ length: 10}, (_, i) => i + 8)
																.map((hour) => (
																	<Button
																		key={hour}
																		size='icon'
																		variant={
																			field.value && field.value.getHours() === hour
																				? 'default'
																				: 'ghost'
																		}
																		className="sm:w-full shrink-0 aspect-square"
																		onClick={() =>
																			handleTimeChange('hour', hour.toString())
																		}
																	>
																		{hour}
																	</Button>
																))
															}
														</div>
														<ScrollBar
															orientation="horizontal"
															className="sm:hidden"
														/>
													</ScrollArea>
													<ScrollArea className="w-64 sm:w-auto">
														<div className="flex sm:flex-col p-2">
															{Array.from({ length: 2}, (_, i) => i * 30)
																.map((minute) => (
																	<Button
																		key={minute}
																		size='icon'
																		variant={
																			field.value && field.value.getMinutes() === minute
																				? 'default'
																				: 'ghost'
																		}
																		className="sm:w-full shrink-0 aspect-square"
																		onClick={() =>
																			handleTimeChange('minute', minute.toString())
																		}
																	>
																		{minute.toString().padStart(2, '0')}
																	</Button>
																))
															}
														</div>
														<ScrollBar
															orientation="horizontal"
															className="sm:hidden"
														/>
													</ScrollArea>
												</div>
											</div>
										</PopoverContent>
									</Popover>
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
												onChange(values.floatValue)
											}}
											onKeyDown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault()
													e.currentTarget.blur()
												}
											}}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
                        />

						<FormField
							control={form.control}
							name="workers"
							render={({ field }) => {
								const selectedValues = field.value || []

								return (
									<FormItem>
										<FormLabel>Pekerja</FormLabel>
										<Popover modal>
											<PopoverTrigger asChild>
												<FormControl>
													<Button
														variant="outline"
														role="combobox"
														className={cn(
															"w-full justify-between h-auto min-h-10",
															selectedValues.length > 0 ? "p-1" : "p-2"
														)}
													>
														{selectedValues.length > 0 ? (
															<div className="flex flex-wrap gap-1">
																{selectedValues.map((workerId: string) => {
																	const worker = workerList.find((w) => w.firebaseUid === workerId)
																	return (
																		<Badge key={workerId} variant='secondary' className="mr-1 mb-1">
																			{worker?.username}
																			<div
																				className="ml-1 cursor-pointer ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
																				onMouseDown={(e) => {
																					e.preventDefault()
																					e.stopPropagation()
																					const newValue = selectedValues.filter((firebaseUid: string) => firebaseUid !== workerId)
																					field.onChange(newValue)
																				}}
																			>
																				<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
																			</div>
																		</Badge>
																	)
																})}
															</div>
														) : (
															<span className="text-muted-foreground ml-2">
																{isWorkersLoading ? "Loading..." : "Pilih pekerja..."}
															</span>
														)}

														{isWorkersLoading ? (
															<Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
														) : (
															<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 self-center" />
														)}
													</Button>
												</FormControl>
											</PopoverTrigger>
											<PopoverContent 
												className="w-[var(--radix-popover-trigger-width)] p-0" 
												align="start"
												onOpenAutoFocus={(e) => e.preventDefault()}
											>
												<Command>
													<CommandInput placeholder="Cari pekerja..." disabled={isWorkersLoading} />
													<CommandList className="max-h-[200px] overflow-y-auto">
														{isWorkersLoading ? (
															<div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
																<Loader2 className="h-6 w-6 animate-spin mb-2" />
                        										<span>Mengambil data pekerja...</span>
															</div>
														) : (
															<>
																<CommandEmpty>Data pekerja tidak ditemukan.</CommandEmpty>
																<CommandGroup>
																	{workerList.map((worker) => {
																		const isSelected = selectedValues.includes(worker.firebaseUid)

																		return (
																			<CommandItem
																				key={worker.firebaseUid}
																				value={worker.username}
																				onSelect={() => {
																					if (isSelected) {
																						field.onChange(selectedValues.filter((firebaseUid: string) => firebaseUid !== worker.firebaseUid))
																					} else {
																						field.onChange([...selectedValues, worker.firebaseUid])
																					}
																				}}
																			>
																				<div
																					className={cn(
																						"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
																						isSelected
																						? "bg-primary text-primary-foreground"
																						: "opacity-50 [&_svg]:invisible"
																					)}
																					>
																					<Check className={cn("h-4 w-4")} />
																				</div>
																					{worker.username}
																			</CommandItem>
																		)
																	})}
																</CommandGroup>
															</>
														)}
													</CommandList>
												</Command>
											</PopoverContent>
										</Popover>
										<FormMessage />
									</FormItem>
								)
							}}
						/>

						<FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => {
                                const scheduleDate = form.watch('scheduleDate');
                                const workers = form.watch('workers');
                                const isMissingReqs = !scheduleDate || !workers || workers.length === 0;

                                return (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.values(JOB_STATUS).map((status) => (
                                                    <SelectItem 
                                                        key={status} 
                                                        value={status}
                                                        disabled={isMissingReqs && (status === JOB_STATUS.SCHEDULED || status === JOB_STATUS.DONE)}
                                                    >
                                                        {status.toUpperCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )
                            }}
                        />

                        <DialogFooter className="md:justify-between">
                            <DialogClose asChild>
                                <Button disabled={isLoading} type="button" variant="destructive">
                                    Batal
                                </Button>
                            </DialogClose>
							<Button loading={isLoading}>
								Simpan
							</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent >
        </Dialog >
    )
}