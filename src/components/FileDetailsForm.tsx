import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, ChevronDown, ChevronUp, Wallet, Upload, Shield, X, Save, AlertTriangle, Info, DollarSign, Lock, Globe, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TagsInput } from '@/components/ui/tags-input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  externalLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),

  // Storage & Hosted File Metadata
  hostedFileUrl: z.string().url('Must be a valid URL').optional(),
  storagePath: z.string().optional(),
  ipfsCid: z.string().optional(),
  fileChecksum: z.string().optional(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
  thumbnailUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),

  // Token Details
  tokenStandard: z.enum(['ERC-721', 'ERC-1155']),
  supplyEditionSize: z.number().min(1, 'Supply must be at least 1').max(10000, 'Supply cannot exceed 10000'),
  editionNumbering: z.boolean(),
  editionFormat: z.string().optional(),
  metadataMutability: z.enum(['mutable', 'immutable']),
  tokenName: z.string().optional(),
  tokenSymbol: z.string().optional(),
  baseUri: z.string().optional(),

  // Blockchain & Multichain
  primaryChain: z.enum(['ethereum', 'polygon', 'bnb', 'solana', 'avalanche', 'arbitrum', 'optimism']),
  additionalChains: z.array(z.string()).optional(),
  mintingMode: z.enum(['direct', 'lazy']),
  contractChoice: z.enum(['existing', 'new', 'factory']),
  upgradeability: z.boolean(),
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
      externalLink: '',

      // Storage & Hosted File Metadata
      hostedFileUrl: '',
      storagePath: '',
      ipfsCid: '',
      fileChecksum: '',
      mimeType: '',
      fileSize: 0,
      thumbnailUrl: '',

      // Token Details
      tokenStandard: 'ERC-721',
      supplyEditionSize: 1,
      editionNumbering: false,
      editionFormat: '',
      metadataMutability: 'immutable',
      tokenName: '',
      tokenSymbol: '',
      baseUri: '',

      // Blockchain & Multichain
      primaryChain: 'ethereum',
      additionalChains: [],
      mintingMode: 'direct',
      contractChoice: 'new',
      upgradeability: false,
    },
  });

  const watchTokenStandard = form.watch('tokenStandard');
  
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
      image: formData.hostedFileUrl || formData.thumbnailUrl,
      attributes: [
        { trait_type: "Creator", value: formData.creatorName },
        { trait_type: "Token Standard", value: formData.tokenStandard },
        { trait_type: "Supply", value: formData.supplyEditionSize.toString() },
        { trait_type: "Chain", value: formData.primaryChain },
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
              
              <Accordion type="multiple" defaultValue={["basic", "token", "blockchain"]} className="w-full">
                
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
                  </AccordionContent>
                </AccordionItem>

                {/* Storage & File Metadata Section */}
                <AccordionItem value="storage">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Storage & File Metadata
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="hostedFileUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hosted File URL (Supabase)</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-filled after upload" {...field} readOnly />
                            </FormControl>
                            <FormDescription>Public URL from Supabase storage</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ipfsCid"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IPFS CID (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="QmHash..." {...field} />
                            </FormControl>
                            <FormDescription>If pinned to IPFS/Arweave</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fileChecksum"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File Checksum (SHA-256)</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-computed" {...field} readOnly />
                            </FormControl>
                            <FormDescription>For provenance and tamper detection</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="thumbnailUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Thumbnail / Preview URL</FormLabel>
                            <FormControl>
                              <Input placeholder="Auto-generated" {...field} />
                            </FormControl>
                            <FormDescription>For marketplace listings</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>MIME Type</Label>
                        <Input placeholder="image/png" readOnly />
                        <p className="text-sm text-muted-foreground mt-1">Auto-detected</p>
                      </div>
                      <div>
                        <Label>File Size</Label>
                        <Input placeholder="2.5 MB" readOnly />
                        <p className="text-sm text-muted-foreground mt-1">Human readable</p>
                      </div>
                      <div>
                        <Label>Storage Path</Label>
                        <Input placeholder="assets/user123/file.png" readOnly />
                        <p className="text-sm text-muted-foreground mt-1">Bucket path</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Token Details Section */}
                <AccordionItem value="token">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Token Details
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Token Standard */}
                      <FormField
                        control={form.control}
                        name="tokenStandard"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token Standard *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ERC-721">ERC-721 (Unique NFT)</SelectItem>
                                <SelectItem value="ERC-1155">ERC-1155 (Editions)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Supply/Edition Size */}
                      <FormField
                        control={form.control}
                        name="supplyEditionSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Supply / Edition Size *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormDescription>
                              {watchTokenStandard === 'ERC-721' ? '1 = unique NFT' : 'Number of editions (max 10,000)'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Metadata Mutability */}
                      <FormField
                        control={form.control}
                        name="metadataMutability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Metadata Mutability</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="immutable">
                                  <div className="flex items-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    Immutable (Recommended)
                                  </div>
                                </SelectItem>
                                <SelectItem value="mutable">Mutable (Can be updated)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>Immutable recommended for authenticity</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Edition Numbering */}
                    <FormField
                      control={form.control}
                      name="editionNumbering"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Enable Edition Numbering</FormLabel>
                            <FormDescription>
                              Show numbering like "3/100" when editions greater than 1
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Collection Details */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Collection Details (if creating new)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="tokenName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Collection Name</FormLabel>
                              <FormControl>
                                <Input placeholder="My NFT Collection" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tokenSymbol"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Collection Symbol</FormLabel>
                              <FormControl>
                                <Input placeholder="MNC" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Blockchain & Multichain Section */}
                <AccordionItem value="blockchain">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Blockchain & Multichain
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                      {/* Minting Mode */}
                      <FormField
                        control={form.control}
                        name="mintingMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minting Mode *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="direct" id="direct" />
                                  <Label htmlFor="direct">Direct mint (immediate on-chain - creator pays gas)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="lazy" id="lazy" />
                                  <Label htmlFor="lazy">Lazy mint (off-chain metadata - buyer pays gas)</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Contract Choice */}
                      <FormField
                        control={form.control}
                        name="contractChoice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contract Choice *</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="existing" id="existing" />
                                  <Label htmlFor="existing">Mint under existing collection</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="new" id="new" />
                                  <Label htmlFor="new">Deploy new collection/contract</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="factory" id="factory" />
                                  <Label htmlFor="factory">Use factory (managed multi-deploy)</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Upgradeability */}
                    <FormField
                      control={form.control}
                      name="upgradeability"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Upgradeability / Proxy (Advanced)</FormLabel>
                            <FormDescription>
                              Allows contract upgrades - adds complexity and risk
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
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