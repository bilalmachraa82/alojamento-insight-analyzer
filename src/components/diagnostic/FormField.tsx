
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
            {React.isValidElement(children) ? 
              React.cloneElement(children as React.ReactElement, {
                ...field,
                // Handle onChange differently based on component type
                onChange: determineOnChangeHandler(children, field)
              })
            : children}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Separate function to determine the appropriate onChange handler
function determineOnChangeHandler(
  children: React.ReactElement, 
  field: any
): ((e: any) => void) {
  // Safe access to displayName using optional chaining
  const isSelectComponent = children.type && 
    typeof children.type === 'object' && 
    'displayName' in children.type && 
    children.type.displayName === 'Select';
  
  if (isSelectComponent) {
    // For Select components, use field.onChange directly
    return field.onChange;
  }
  
  // For all other components, handle both event and direct value cases
  return (e: any) => field.onChange(e?.target?.value !== undefined ? e.target.value : e);
}

export default DiagnosticFormField;
