
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { SelectTrigger } from "@/components/ui/select";

interface DiagnosticFormFieldProps {
  form: UseFormReturn<any>;
  name: string;
  label: string;
  children: React.ReactNode;
}

// A type guard to check if the element is a valid React element
function isValidReactElement(element: React.ReactNode): element is React.ReactElement {
  return React.isValidElement(element);
}

// A type guard to check if an element is likely a Select component
function isSelectComponent(element: React.ReactElement): boolean {
  // Check if the element type is an object with a displayName property
  if (!element || !element.type) return false;
  
  // Check for displayName via type object
  if (typeof element.type === 'object' && element.type !== null) {
    return (element.type as any)?.displayName === 'Select';
  }
  
  return false;
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
            {isValidReactElement(children) ? (
              // Clone the element with properly typed props
              React.cloneElement(children, {
                ...(field as any), // Cast to any to avoid TypeScript errors with unknown prop types
                onChange: (e: any) => {
                  // For Select components, handle differently
                  if (isSelectComponent(children)) {
                    field.onChange(e);
                  } else {
                    // For standard input components with event objects
                    field.onChange(e?.target?.value !== undefined ? e.target.value : e);
                  }
                }
              })
            ) : children}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DiagnosticFormField;
