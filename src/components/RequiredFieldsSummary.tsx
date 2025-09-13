import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RequiredField {
  field: string;
  section: string;
  validation: string;
  description: string;
}

const RequiredFieldsSummary: React.FC = () => {
  const requiredFields: RequiredField[] = [
    // Basic Information - Critical
    {
      field: "Asset Title",
      section: "Basic Information",
      validation: "Required, max 120 characters",
      description: "Short, human-readable title for your NFT"
    },
    {
      field: "Short Description", 
      section: "Basic Information",
      validation: "Required, max 1000 characters",
      description: "1–3 sentence summary of your asset"
    },
    {
      field: "Creator / Artist Name",
      section: "Basic Information", 
      validation: "Required",
      description: "Shown on token metadata"
    },

    // Token Details - Critical
    {
      field: "Token Standard",
      section: "Token Details",
      validation: "Required (ERC-721 or ERC-1155)",
      description: "Blockchain standard for your NFT"
    },
    {
      field: "Supply / Edition Size",
      section: "Token Details",
      validation: "Required, min 1, max 10,000",
      description: "Number of tokens to mint (1 = unique)"
    },

    // Blockchain - Critical
    {
      field: "Primary Chain",
      section: "Blockchain & Multichain",
      validation: "Required",
      description: "Blockchain network to mint on"
    },
    {
      field: "Minting Mode",
      section: "Blockchain & Multichain", 
      validation: "Required (Direct or Lazy)",
      description: "When gas fees are paid"
    },
    {
      field: "Contract Choice",
      section: "Blockchain & Multichain",
      validation: "Required (Existing, New, or Factory)",
      description: "How to deploy your NFT contract"
    },

    // Royalties - Critical
    {
      field: "Royalty Percentage",
      section: "Royalties & Payouts",
      validation: "Required, 0-20%",
      description: "Percentage earned on secondary sales"
    },
    {
      field: "Royalty Recipient Address",
      section: "Royalties & Payouts", 
      validation: "Required, valid wallet address",
      description: "Where royalty payments are sent"
    },

    // Legal - Critical
    {
      field: "Legal Terms Acceptance",
      section: "Compliance & Safety",
      validation: "Required (must check)",
      description: "Confirm you own rights to tokenize this asset"
    }
  ];

  const criticalFields = requiredFields.filter(field => 
    ["Asset Title", "Short Description", "Creator / Artist Name", "Royalty Recipient Address", "Legal Terms Acceptance"].includes(field.field)
  );

  const defaultFields = requiredFields.filter(field => 
    !["Asset Title", "Short Description", "Creator / Artist Name", "Royalty Recipient Address", "Legal Terms Acceptance"].includes(field.field)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Mandatory Required Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>All fields marked with (*) are required.</strong> The form cannot be submitted without completing these fields.
            </AlertDescription>
          </Alert>

          {/* Critical Fields - Must be filled by user */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Critical</Badge>
              <h3 className="font-semibold">Must be filled manually</h3>
            </div>
            
            <div className="grid gap-3">
              {criticalFields.map((field, index) => (
                <div key={index} className="border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50/50 dark:bg-red-950/20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium text-red-900 dark:text-red-100">
                        {field.field} *
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {field.description}
                      </div>
                      <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                        {field.section}
                      </Badge>
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 text-right">
                      {field.validation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Default Fields - Have defaults but are still required */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Has Defaults</Badge>
              <h3 className="font-semibold">Required but pre-filled</h3>
            </div>
            
            <div className="grid gap-3">
              {defaultFields.map((field, index) => (
                <div key={index} className="border border-border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {field.field} *
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {field.description}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {field.section}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {field.validation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Focus on the critical fields first. Fields with defaults are pre-filled with recommended values but can be customized.
            </AlertDescription>
          </Alert>

        </CardContent>
      </Card>
    </div>
  );
};

export default RequiredFieldsSummary;