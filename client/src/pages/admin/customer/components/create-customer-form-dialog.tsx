import { Button } from "@/components/custom/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/contexts/ConfirmContext";
import { handleError } from "@/hooks/error-handler";
import api from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const registerSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	address: z.string().trim().min(1, 'Alamat wajib diisi'),
	phone: z.string().trim().optional()
});

interface CreateCustomerFormDialogProps {
	onCustomerCreated: () => Promise<void>;
}

export function CreateCustomerFormDialog({ onCustomerCreated }: CreateCustomerFormDialogProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
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
				setIsDialogOpen(false)
			}

			window.addEventListener('popstate', onPopState)

			return () => {
				if (!isBackEvent.current) {
					window.history.back()
				}

				isBackEvent.current = false
			}
		}
	}, [isDialogOpen])
	
	// form
	const form = useForm<z.infer<typeof registerSchema>>({
		resolver: zodResolver(registerSchema),
		defaultValues: {
            name: '',
            address: '',
            phone: ''
		}
	});

	const onSubmit = async (values: z.infer<typeof registerSchema>) => {
		setIsLoading(true)

		const isConfirmed = await confirm({
			title: 'Apakah anda yakin?',
			description: 'Customer ini akan ditambahkan.'
		})

		if (!isConfirmed) {
			setIsLoading(false)
			return
		}

		try {
			const result = await api.post('/customers', {
				name: values.name,
				address: values.address,
				phone: values.phone
			})

			toast.success(result.data.message)
			await onCustomerCreated()

			setIsDialogOpen(false)
			form.reset()
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
			onOpenChange={(open) => {
				setIsDialogOpen(open)

				if (!open){
					form.reset()
				}
			}}
		>
			<div className="md:flex md:justify-end">
				<DialogTrigger asChild>
					<Button variant='default' size='sm' className="w-full md:w-auto"> <IconPlus size={18} className='mr-2' />Buat Baru</Button>
				</DialogTrigger>
			</div>
            <DialogContent className="sm:max-w-md overflow-y-auto max-h-[80vh]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <DialogHeader>
                            <DialogTitle>Tambah Customer</DialogTitle>
                            <DialogDescription>Silahkan isi sesuai dengan kolom yang telah diberikan.</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nama Customer" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
						<FormField
							control={form.control}
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Alamat<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
									<FormControl>
										<Textarea placeholder="Alamat Customer" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telepon</FormLabel>
                                    <FormControl>
                                        <Input placeholder="No Telepon Customer" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
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