import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface RequiredFieldsStatusProps {
  form: UseFormReturn<any>;
}

const RequiredFieldsStatus: React.FC<RequiredFieldsStatusProps> = ({ form }) => {
  const formValues = form.watch();
  const formErrors = form.formState.errors;

  const requiredFields = [
    { 
      key: 'assetTitle', 
      label: 'Asset Title', 
      section: 'Basic Info',
      check: (value: any) => value && value.length > 0 && value.length <= 120
    },
    { 
      key: 'shortDescription', 
      label: 'Short Description', 
      section: 'Basic Info',
      check: (value: any) => value && value.length > 0 && value.length <= 1000
    },
    { 
      key: 'creatorName', 
      label: 'Creator Name', 
      section: 'Basic Info',
      check: (value: any) => value && value.length > 0
    },
    { 
      key: 'royaltyRecipient', 
      label: 'Royalty Recipient', 
      section: 'Royalties',
      check: (value: any) => value && value.length > 0
    },
    { 
      key: 'jurisdictionTerms', 
      label: 'Legal Terms', 
      section: 'Compliance',
      check: (value: any) => value === true
    },
  ];

  const getFieldStatus = (field: any) => {
    const value = formValues[field.key];
    const hasError = formErrors[field.key];
    
    if (hasError) {
      return { status: 'error', icon: XCircle, color: 'text-red-500' };
    } else if (field.check(value)) {
      return { status: 'complete', icon: CheckCircle, color: 'text-green-500' };
    } else {
      return { status: 'pending', icon: AlertCircle, color: 'text-orange-500' };
    }
  };

  const completedFields = requiredFields.filter(field => {
    const fieldStatus = getFieldStatus(field);
    return fieldStatus.status === 'complete';
  });

  const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Required Fields Status</span>
          <Badge variant={completionPercentage === 100 ? 'default' : 'secondary'}>
            {completedFields.length}/{requiredFields.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                completionPercentage === 100 ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            {completionPercentage}% Complete
          </div>

          <div className="space-y-1 mt-3">
            {requiredFields.map((field) => {
              const { status, icon: Icon, color } = getFieldStatus(field);
              return (
                <div key={field.key} className="flex items-center gap-2 text-xs">
                  <Icon className={`h-3 w-3 ${color}`} />
                  <span className="flex-1">{field.label}</span>
                  <Badge variant="outline" className="text-xs py-0 px-1">
                    {field.section}
                  </Badge>
                </div>
              );
            })}
          </div>

          {completionPercentage === 100 && (
            <div className="mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                <CheckCircle className="h-3 w-3" />
                <span>All required fields completed!</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequiredFieldsStatus;