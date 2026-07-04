"use client";

// components/CreateOrderModal.tsx
// Modal dialog with form for creating a new order.
// Uses React Hook Form + Zod validation.

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateOrder } from "@/hooks/useOrders";
import { Loader2, PlusCircle } from "lucide-react";

const schema = z.object({
  customer_name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(255, "Name too long"),
  amount: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Amount must be a positive number",
    }),
});

type FormValues = z.infer<typeof schema>;

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateOrderModal({ open, onClose }: CreateOrderModalProps) {
  const createOrder = useCreateOrder();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    await createOrder.mutateAsync({
      customer_name: values.customer_name,
      amount: Number(values.amount),
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white border border-slate-200 text-slate-800 max-w-md shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <PlusCircle className="w-5 h-5 text-violet-600" />
            Create New Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2">
          {/* Customer Name */}
          <div className="space-y-1.5">
            <Label htmlFor="customer_name" className="text-slate-600">
              Customer Name
            </Label>
            <Input
              id="customer_name"
              {...register("customer_name")}
              placeholder="Name"
              className="bg-white border-slate-200 text-slate-850 placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
            />
            {errors.customer_name && (
              <p className="text-xs text-red-500 font-medium">{errors.customer_name.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-slate-600">
              Amount (₹ INR)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                {...register("amount")}
                placeholder="Amount"
                className="bg-white border-slate-200 text-slate-850 placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 pl-8"
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-red-500 font-medium">{errors.amount.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createOrder.isPending}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Order
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
