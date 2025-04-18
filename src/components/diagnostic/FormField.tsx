
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
                    // Store children.type in a constant and perform a strict check
                    const childType = children.type;
                    
                    // First check if childType is defined
                    if (childType === null || childType === undefined) {
                      return (e: any) => field.onChange(e?.target?.value !== undefined ? e.target.value : e);
                    }
                    
                    // Then check if it's an object and has the right displayName
                    if (typeof childType === 'object' && 
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
