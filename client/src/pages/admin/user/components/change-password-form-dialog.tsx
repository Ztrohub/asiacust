import { Button } from "@/components/custom/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/contexts/ConfirmContext";
import { handleError } from "@/hooks/error-handler";
import api from "@/services/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const changePasswordSchema = z.object({
	password: z.string().min(6, 'Password harus memiliki minimal 6 karakter')
});

interface ChangePasswordFormDialogProps {
    isDialogOpen: boolean;
    onOpenChange: (open: boolean) => void;
    firebaseUid: string | null;
}

export function ChangePasswordFormDialog({ isDialogOpen, onOpenChange, firebaseUid }: ChangePasswordFormDialogProps) {
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
	const form = useForm<z.infer<typeof changePasswordSchema>>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			password: ''
		}
	});

    useEffect(() => {
        if (!isDialogOpen) {
            form.reset()
        }
    }, [isDialogOpen, form])

	const onSubmit = async (values: z.infer<typeof changePasswordSchema>) => {
		if (!firebaseUid) {
			return
		}
        
        setIsLoading(true)

		const isConfirmed = await confirm({
			title: 'Apakah anda yakin?',
			description: 'Password user ini akan diubah.'
		})

		if (!isConfirmed) {
			setIsLoading(false)
			return
		}

		try {
			const result = await api.patch(`/users/${firebaseUid}/password`, {
				password: values.password,
			})

			toast.success(result.data.message)

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
                            <DialogTitle>Ganti Password</DialogTitle>
                            <DialogDescription>Silahkan masukkan password baru.</DialogDescription>
                        </DialogHeader>
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