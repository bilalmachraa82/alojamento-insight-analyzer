
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
              React.cloneElement(children, {
                ...field,
                onChange: getAppropriateOnChangeHandler(children, field)
              })
            : children}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Helper function to safely check if an element is a Select component
function isSelectComponent(element: React.ReactElement): boolean {
  if (!element.type) return false;
  
  if (typeof element.type === 'object') {
    return element.type?.displayName === 'Select';
  }
  
  return false;
}

// Get the appropriate onChange handler based on component type
function getAppropriateOnChangeHandler(
  element: React.ReactElement,
  field: any
): ((e: any) => void) {
  if (isSelectComponent(element)) {
    // For Select components, use field.onChange directly
    return field.onChange;
  }
  
  // For all other components, handle both event and direct value cases
  return (e: any) => field.onChange(e?.target?.value !== undefined ? e.target.value : e);
}

export default DiagnosticFormField;
