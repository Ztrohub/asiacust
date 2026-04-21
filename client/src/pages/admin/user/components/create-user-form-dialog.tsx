import { Button } from "@/components/custom/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConfirm } from "@/contexts/ConfirmContext";
import { handleError } from "@/hooks/error-handler";
import api from "@/services/api";
import { USER_ROLE } from "@/shared/types/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconPlus } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const registerSchema = z.object({
	username: z
		.string()
		.trim()
		.min(3, 'Username harus memiliki minimal 3 karakter')
		.max(20, 'Username maksimal 20 karakter')
		.regex(
			/^[a-zA-Z0-9_]+$/,
			'Username hanya boleh mengandung huruf, angka, dan underscore'
		),
	password: z.string().min(6, 'Password harus memiliki minimal 6 karakter'),
	role: z.enum(USER_ROLE, {
		message: `Role harus salah satu dari: ${Object.values(USER_ROLE).join(', ')}`
	})
});

interface CreateUserFormDialogProps {
	onUserCreated: () => Promise<void>;
}

export function CreateUserFormDialog({ onUserCreated }: CreateUserFormDialogProps) {
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
			username: '',
			password: '',
			role: USER_ROLE.ADMIN
		}
	});

	const onSubmit = async (values: z.infer<typeof registerSchema>) => {
		setIsLoading(true)

		const isConfirmed = await confirm({
			title: 'Apakah anda yakin?',
			description: 'User ini akan ditambahkan.'
		})

		if (!isConfirmed) {
			setIsLoading(false)
			return
		}

		try {
			const result = await api.post('/users', {
				username: values.username,
				password: values.password,
				role: values.role
			})

			toast.success(result.data.message)
			await onUserCreated()

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
                            <DialogTitle>Tambah User</DialogTitle>
                            <DialogDescription>Silahkan isi sesuai dengan kolom yang telah diberikan.</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nama Pekerja" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
									<FormControl>
										<Input placeholder="Password" type="password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Posisi<span className="text-red-500 dark:text-red-400">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih posisi pekerja" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {
                                                Object.values(USER_ROLE).map((role) => (
                                                    <SelectItem key={role} value={role}>
                                                        {role.toUpperCase()}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
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