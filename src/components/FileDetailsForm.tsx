import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Upload, X, Save, Info, FileText, CalendarIcon } from 'lucide-react';
import { TagsInput } from '@/components/ui/tags-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import MintingFlow from './MintingFlow';

// Simplified NFT minting form validation schema
const formSchema = z.object({
  // Basic Information
  assetTitle: z.string().min(1, 'Asset title is required').max(120, 'Title must be under 120 characters'),
  shortDescription: z.string().min(1, 'Description is required').max(1000, 'Description must be under 1000 characters'),
  categoryTags: z.array(z.string()).optional(),
  creatorName: z.string().min(1, 'Creator name is required'),
  organizationName: z.string().optional(),
  creationDate: z.date().optional(),
  externalLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  externalLink2: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  
  // Keep only essential fields
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  storagePath: z.string().optional(),
  primaryChain: z.enum(['ethereum', 'polygon', 'bnb', 'solana', 'avalanche', 'arbitrum', 'optimism']),
});

type FormData = z.infer<typeof formSchema>;

interface FileDetailsFormProps {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

const FileDetailsForm: React.FC<FileDetailsFormProps> = ({ onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string>('~0.05 ETH');
  const [showMintingFlow, setShowMintingFlow] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Basic Information
      assetTitle: '',
      shortDescription: '',
      categoryTags: [],
      creatorName: '',
      organizationName: '',
      creationDate: undefined,
      externalLink: '',
      externalLink2: '',
      
      // Essential fields
      mimeType: '',
      fileSize: 0,
      storagePath: '',
      primaryChain: 'ethereum',
    },
  });
  
  const handleSubmit = (data: FormData) => {
    console.log('NFT Minting Form submitted:', data);
    setFormData(data);
    setShowMintingFlow(true);
  };

  const handleMintingComplete = () => {
    setShowMintingFlow(false);
    setFormData(null);
    onCancel(); // Return to main view
  };

  const handleBackFromMinting = () => {
    setShowMintingFlow(false);
  };

  if (showMintingFlow && formData) {
    return (
      <MintingFlow 
        formData={formData}
        onComplete={handleMintingComplete}
        onBack={handleBackFromMinting}
      />
    );
  }

  const chainIcons = {
    ethereum: '⟡',
    polygon: '🔷',
    bnb: '🟡',
    solana: '🌅',
    avalanche: '🔺',
    arbitrum: '🔵',
    optimism: '🔴'
  };

  const generatePreview = () => {
    const formData = form.getValues();
    return {
      name: formData.assetTitle,
      description: formData.shortDescription,
      attributes: [
        { trait_type: "Creator", value: formData.creatorName },
        { trait_type: "Chain", value: formData.primaryChain },
        { trait_type: "MIME Type", value: formData.mimeType },
        { trait_type: "File Size", value: formData.fileSize?.toString() },
      ]
    };
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-card border rounded-xl p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">NFT Minting Platform</h2>
              <p className="text-muted-foreground">Create and deploy your digital assets to blockchain</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? 'Edit Mode' : 'Preview'}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onCancel}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Gas Estimate Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Estimated Gas Cost:</strong> {estimatedGas} • Network fees vary based on congestion
          </AlertDescription>
        </Alert>

        {previewMode ? (
          /* Preview Mode */
          <Card>
            <CardHeader>
              <CardTitle>Token Metadata Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(generatePreview(), null, 2)}
              </pre>
            </CardContent>
          </Card>
        ) : (
          /* Form Mode */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              
              <Accordion type="multiple" defaultValue={["basic"]} className="w-full">
                
                {/* Basic Information Section */}
                <AccordionItem value="basic">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Basic Information
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Asset Title */}
                      <FormField
                        control={form.control}
                        name="assetTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Title *</FormLabel>
                            <FormControl>
                              <Input placeholder="Short, human-readable title" {...field} />
                            </FormControl>
                            <FormDescription>Short, human-readable. Required, max 120 chars.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Creator Name */}
                      <FormField
                        control={form.control}
                        name="creatorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Creator / Artist Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-fill from profile" {...field} />
                            </FormControl>
                            <FormDescription>Shown on token metadata. Required.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Organization Name */}
                      <FormField
                        control={form.control}
                        name="organizationName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Company or organization name" {...field} />
                            </FormControl>
                            <FormDescription>Optional. Organization associated with this NFT.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* NFT Creation Date */}
                      <FormField
                        control={form.control}
                        name="creationDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>NFT Creation Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span className="text-muted-foreground">Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              The date when this NFT was originally created (Optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Primary Chain */}
                      <FormField
                        control={form.control}
                        name="primaryChain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Chain to Mint On *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ethereum">
                                  <div className="flex items-center gap-2">
                                    <span>{chainIcons.ethereum}</span>
                                    Ethereum
                                  </div>
                                </SelectItem>
                                <SelectItem value="polygon">
                                  <div className="flex items-center gap-2">
                                    <span>{chainIcons.polygon}</span>
                                    Polygon
                                  </div>
                                </SelectItem>
                                <SelectItem value="bnb">
                                  <div className="flex items-center gap-2">
                                    <span>{chainIcons.bnb}</span>
                                    BNB Chain
                                  </div>
                                </SelectItem>
                                <SelectItem value="solana">
                                  <div className="flex items-center gap-2">
                                    <span>{chainIcons.solana}</span>
                                    Solana
                                  </div>
                                </SelectItem>
                                <SelectItem value="avalanche">
                                  <div className="flex items-center gap-2">
                                    <span>{chainIcons.avalanche}</span>
                                    Avalanche
                                  </div>
                                </SelectItem>
                                <SelectItem value="arbitrum">
                                  <div className="flex items-center gap-2">
                                    <span>{chainIcons.arbitrum}</span>
                                    Arbitrum
                                  </div>
                                </SelectItem>
                                <SelectItem value="optimism">
                                  <div className="flex items-center gap-2">
                                    <span>{chainIcons.optimism}</span>
                                    Optimism
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* External Link */}
                      <FormField
                        control={form.control}
                        name="externalLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>External Link / Provenance URL</FormLabel>
                            <FormControl>
                              <Input 
                                type="url"
                                placeholder="https://portfolio.example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>Portfolio, certificate link, previous sale, etc. (Optional)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* External Link 2 */}
                      <FormField
                        control={form.control}
                        name="externalLink2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional External Link</FormLabel>
                            <FormControl>
                              <Input 
                                type="url"
                                placeholder="https://additional-link.example.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>Additional reference, social media, or related content. (Optional)</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Short Description */}
                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="1–3 sentence summary of your asset..."
                              className="min-h-[120px]"
                              maxLength={1000}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>1–3 sentence summary. Required, max 1000 chars.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Category Tags */}
                    <FormField
                      control={form.control}
                      name="categoryTags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category / Tags</FormLabel>
                          <FormControl>
                            <TagsInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="art, photo, music, document, collectible, real-world, utility"
                            />
                          </FormControl>
                          <FormDescription>
                            Examples: art, photo, music, document, collectible, real-world, utility. Optional but recommended.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Information */}
                    <div className="space-y-4">
                      <h4 className="font-medium">File Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="mimeType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>MIME Type</FormLabel>
                              <FormControl>
                                <Input placeholder="image/png" {...field} readOnly />
                              </FormControl>
                              <FormDescription>Auto-detected</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="fileSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>File Size</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="2.5 MB" 
                                  value={field.value ? `${field.value} bytes` : ''} 
                                  readOnly 
                                />
                              </FormControl>
                              <FormDescription>Human readable</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="storagePath"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Storage Path</FormLabel>
                              <FormControl>
                                <Input placeholder="assets/user123/file.png" {...field} readOnly />
                              </FormControl>
                              <FormDescription>Bucket path</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>

              {/* Submit Section */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button type="submit" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Create NFT
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default FileDetailsForm;
