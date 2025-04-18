
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";

interface DiagnosticFormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  children: React.ReactNode;
}

const DiagnosticFormField = ({ form, name, label, children }: DiagnosticFormFieldProps) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {React.cloneElement(children as React.ReactElement, { ...field })}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DiagnosticFormField;
