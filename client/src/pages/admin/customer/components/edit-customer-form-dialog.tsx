import { Button } from "@/components/custom/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/contexts/ConfirmContext";
import { handleError } from "@/hooks/error-handler";
import api from "@/services/api";
import { ICustomer } from "@/shared/types/customer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const editSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi'),
	address: z.string().trim().min(1, 'Alamat wajib diisi'),
	phone: z.string().trim().optional()
});

interface EditCustomerFormDialogProps {
	customer: ICustomer | null;
	isDialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
	onCustomerEdited: () => Promise<void>;
}

export function EditCustomerFormDialog({ customer, isDialogOpen, onOpenChange, onCustomerEdited }: EditCustomerFormDialogProps) {
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

	// form
	const form = useForm<z.infer<typeof editSchema>>({
		resolver: zodResolver(editSchema),
		defaultValues: {
            name: '',
            address: '',
            phone: ''
		}
	});

	useEffect(() => {
		if (isDialogOpen){
			if (customer) {
				form.reset({
					name: customer.name,
					address: customer.address,
					phone: customer.phone || undefined
				})
			} else {
				console.error('Customer tidak ditemukan')
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
			description: 'Customer ini akan diubah.'
		})

		if (!isConfirmed) {
			setIsLoading(false)
			return
		}

		try {
			const result = await api.patch(`/customers/${customer?._id}`, {
				name: values.name,
				address: values.address,
				phone: values.phone
			})

			toast.success(result.data.message)
			await onCustomerEdited()

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
                            <DialogTitle>Edit Customer</DialogTitle>
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