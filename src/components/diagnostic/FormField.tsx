
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
            {React.isValidElement(children)
              ? React.cloneElement(children as React.ReactElement, {
                  ...field,
                  // Special handling for Select components which need different onChange handling
                  onChange: (() => {
                    const childType = children.type;
                    // Check if it's an object and has displayName property
                    if (childType && 
                        typeof childType === 'object' && 
                        'displayName' in childType &&
                        childType.displayName === 'Select') {
                      return field.onChange;
                    }
                    // Default handler for other components
                    return (e: any) => field.onChange(e?.target?.value !== undefined ? e.target.value : e);
                  })()
                })
              : children}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DiagnosticFormField;
