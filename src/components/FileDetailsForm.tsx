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

// Comprehensive NFT minting form validation schema
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

  // Sales & Listing
  listOnMarketplace: z.boolean(),
  saleType: z.enum(['fixed', 'auction', 'not-for-sale']).optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  currency: z.enum(['ETH', 'MATIC', 'BNB', 'SOL', 'AVAX', 'USDC', 'USDT']).optional(),
  saleStartDate: z.date().optional(),
  saleEndDate: z.date().optional(),
  quantityPerBuyer: z.number().min(1).optional(),
  listingVisibility: z.enum(['public', 'unlisted', 'private', 'whitelist']).optional(),

  // Royalties & Payouts
  royaltyPercentage: z.number().min(0, 'Royalty must be positive').max(20, 'Royalty cannot exceed 20%'),
  royaltyRecipient: z.string().min(1, 'Royalty recipient address is required'),
  splitPayments: z.array(z.object({
    address: z.string().min(1, 'Address is required'),
    percentage: z.number().min(0).max(100)
  })).optional(),
  gasFeePayer: z.enum(['creator', 'buyer', 'platform']),
  payoutMethod: z.enum(['immediate', 'delayed', 'escrow', 'multisig']),

  // Provenance & Authenticity
  certificateUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  ownershipProof: z.string().optional(),
  physicalRedemption: z.enum(['none', 'redeemable']),
  custodianInfo: z.string().optional(),
  provenanceNotes: z.string().optional(),

  // Access & Licenses
  unlockableContent: z.boolean(),
  unlockUrl: z.string().optional(),
  licenseType: z.enum(['all-rights', 'non-commercial', 'cc0', 'cc-by', 'custom']),
  customLicense: z.string().optional(),
  transferRestrictions: z.enum(['transferable', 'restricted', 'soulbound']),
  commercialUse: z.enum(['yes', 'no', 'contact']),

  // Compliance & Safety
  kycRequired: z.boolean(),
  kycVerifier: z.string().optional(),
  nsfwFlag: z.boolean(),
  jurisdictionTerms: z.boolean().refine(val => val === true, 'You must accept the terms'),
  copyrightContact: z.string().email('Must be a valid email').optional().or(z.literal('')),

  // Advanced Options
  customContract: z.boolean(),
  ownerAddress: z.string().optional(),
  maxSupply: z.number().optional(),
  eip2981Enforcement: z.boolean(),
  randomnessReveal: z.boolean(),
  whitelistCsv: z.string().optional(),
  batchMinting: z.boolean(),
  batchSize: z.number().optional(),
  auditRequest: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface SplitPayment {
  address: string;
  percentage: number;
}

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
  const [devMode, setDevMode] = useState(false);

  const getDefaultValues = () => ({
    // Basic Information
    assetTitle: devMode ? 'Test NFT Asset Title' : '',
    shortDescription: devMode ? 'This is a test NFT created for development and testing purposes. It demonstrates the minting flow functionality.' : '',
    categoryTags: devMode ? ['art', 'digital', 'test'] : [],
    creatorName: devMode ? 'Test Creator' : '',
    externalLink: devMode ? 'https://example.com/portfolio' : '',

    // Storage & Hosted File Metadata
    hostedFileUrl: devMode ? 'https://example.com/test-image.jpg' : '',
    storagePath: devMode ? '/storage/test-nft' : '',
    ipfsCid: devMode ? 'QmTest123456789' : '',
    fileChecksum: devMode ? 'sha256:abc123def456' : '',
    mimeType: devMode ? 'image/jpeg' : '',
    fileSize: devMode ? 1024000 : 0,
    thumbnailUrl: devMode ? 'https://example.com/test-thumb.jpg' : '',

    // Token Details
    tokenStandard: 'ERC-721' as const,
    supplyEditionSize: devMode ? 1 : 1,
    editionNumbering: false,
    editionFormat: '',
    metadataMutability: 'immutable' as const,
    tokenName: devMode ? 'TestNFT' : '',
    tokenSymbol: devMode ? 'TNFT' : '',
    baseUri: devMode ? 'https://api.example.com/metadata/' : '',

    // Blockchain & Multichain
    primaryChain: 'ethereum' as const,
    additionalChains: [] as string[],
    mintingMode: 'direct' as const,
    contractChoice: 'new' as const,
    upgradeability: false,

    // Sales & Listing
    listOnMarketplace: false,
    saleType: 'not-for-sale' as const,
    price: 0,
    currency: 'ETH' as const,
    quantityPerBuyer: 1,
    listingVisibility: 'public' as const,

    // Royalties & Payouts
    royaltyPercentage: devMode ? 5 : 5,
    royaltyRecipient: devMode ? '0x742d35Cc123C6f34E05861B22048B456123456789' : '',
    splitPayments: [] as SplitPayment[],
    gasFeePayer: 'creator' as const,
    payoutMethod: 'immediate' as const,

    // Provenance & Authenticity
    certificateUrl: devMode ? 'https://example.com/certificate' : '',
    ownershipProof: devMode ? 'Digital signature proof' : '',
    physicalRedemption: 'none' as const,
    custodianInfo: '',
    provenanceNotes: devMode ? 'Created for testing purposes' : '',

    // Access & Licenses
    unlockableContent: false,
    unlockUrl: '',
    licenseType: 'all-rights' as const,
    customLicense: '',
    transferRestrictions: 'transferable' as const,
    commercialUse: 'no' as const,

    // Compliance & Safety
    kycRequired: false,
    kycVerifier: '',
    nsfwFlag: false,
    jurisdictionTerms: devMode ? true : false,
    copyrightContact: devMode ? 'test@example.com' : '',

    // Advanced Options
    customContract: false,
    ownerAddress: devMode ? '0x742d35Cc123C6f34E05861B22048B456789' : '',
    maxSupply: devMode ? 1000 : 0,
    eip2981Enforcement: true,
    randomnessReveal: false,
    whitelistCsv: '',
    batchMinting: false,
    batchSize: 0,
    auditRequest: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),

  });

  const { fields: splitFields, append: appendSplit, remove: removeSplit } = useFieldArray({
    control: form.control,
    name: "splitPayments"
  });

  const watchTokenStandard = form.watch('tokenStandard');
  const watchListOnMarketplace = form.watch('listOnMarketplace');
  const watchUnlockableContent = form.watch('unlockableContent');
  const watchPhysicalRedemption = form.watch('physicalRedemption');
  const watchKycRequired = form.watch('kycRequired');
  const watchCustomContract = form.watch('customContract');
  const watchBatchMinting = form.watch('batchMinting');
  const watchLicenseType = form.watch('licenseType');
  
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

  const fillTestData = () => {
    setDevMode(true);
    form.reset(getDefaultValues());
    toast({
      title: "Test data filled",
      description: "All required fields have been populated with test values",
    });
  };

  const toggleDevMode = () => {
    const newDevMode = !devMode;
    setDevMode(newDevMode);
    
    if (newDevMode) {
      form.reset(getDefaultValues());
      toast({
        title: "Dev mode enabled",
        description: "Form will be pre-filled with test data",
      });
    } else {
      form.reset(getDefaultValues());
      toast({
        title: "Dev mode disabled",
        description: "Form reset to empty values",
      });
    }
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
              onClick={toggleDevMode}
              className={devMode ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : ''}
            >
              {devMode ? 'Dev Mode ON' : 'Dev Mode'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fillTestData}
            >
              Fill Test Data
            </Button>
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

                {/* Sales & Listing Section */}
                <AccordionItem value="sales">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Sales & Listing Options
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    {/* List on Marketplace */}
                    <FormField
                      control={form.control}
                      name="listOnMarketplace"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>List on marketplace now?</FormLabel>
                            <FormDescription>
                              Enable to configure sale options below
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchListOnMarketplace && (
                      <div className="space-y-6 border-l-2 border-primary/20 pl-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Sale Type */}
                          <FormField
                            control={form.control}
                            name="saleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sale Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed Price</SelectItem>
                                    <SelectItem value="auction">Auction (English/Dutch)</SelectItem>
                                    <SelectItem value="not-for-sale">Not for Sale</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Currency */}
                          <FormField
                            control={form.control}
                            name="currency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ETH">ETH - Ethereum</SelectItem>
                                    <SelectItem value="MATIC">MATIC - Polygon</SelectItem>
                                    <SelectItem value="BNB">BNB - BNB Chain</SelectItem>
                                    <SelectItem value="SOL">SOL - Solana</SelectItem>
                                    <SelectItem value="AVAX">AVAX - Avalanche</SelectItem>
                                    <SelectItem value="USDC">USDC - Stablecoin</SelectItem>
                                    <SelectItem value="USDT">USDT - Stablecoin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Price */}
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price / Reserve Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.001"
                                    placeholder="0.05"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormDescription>Positive numeric value</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Listing Visibility */}
                          <FormField
                            control={form.control}
                            name="listingVisibility"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Listing Visibility</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="unlisted">Unlisted</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                    <SelectItem value="whitelist">Whitelist Only</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Sale Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="saleStartDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Sale Start Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Select start date</span>
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
                                      initialFocus
                                      className="pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="saleEndDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Sale End Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Select end date</span>
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
                                      initialFocus
                                      className="pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Royalties Section */}
                <AccordionItem value="royalties">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Royalties, Splits & Payouts
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Royalty Percentage */}
                      <FormField
                        control={form.control}
                        name="royaltyPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Royalty Percentage *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                max="20"
                                step="0.1"
                                placeholder="5"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>Industry norm 2-10%. UI capped at 20%</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Royalty Recipient */}
                      <FormField
                        control={form.control}
                        name="royaltyRecipient"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Royalty Recipient Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="0x..." {...field} />
                            </FormControl>
                            <FormDescription>Wallet address to receive royalties</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Gas Fee Payer */}
                      <FormField
                        control={form.control}
                        name="gasFeePayer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Who Pays Minting/Gas Fees?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="creator">Creator Pays</SelectItem>
                                <SelectItem value="buyer">Buyer Pays (Lazy)</SelectItem>
                                <SelectItem value="platform">Platform Subsidizes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Payout Method */}
                      <FormField
                        control={form.control}
                        name="payoutMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payout Schedule / Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="immediate">Immediate</SelectItem>
                                <SelectItem value="delayed">Delayed</SelectItem>
                                <SelectItem value="escrow">Escrow</SelectItem>
                                <SelectItem value="multisig">Multi-sig</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Split Payments */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Split Payments / Beneficiaries</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendSplit({ address: '', percentage: 0 })}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Split
                        </Button>
                      </div>
                      
                      {splitFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-4 p-4 border rounded-lg">
                          <FormField
                            control={form.control}
                            name={`splitPayments.${index}.address`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Recipient Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="0x..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`splitPayments.${index}.percentage`}
                            render={({ field }) => (
                              <FormItem className="w-32">
                                <FormLabel>Share %</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="25"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeSplit(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {splitFields.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Note: All shares must sum to 100%
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Provenance & Authenticity Section */}
                <AccordionItem value="provenance">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Provenance, Authenticity & Certificates
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="certificateUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Certificate of Authenticity URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://certificates.example.com/cert123" {...field} />
                            </FormControl>
                            <FormDescription>Link to stored PDF or external verifier</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ownershipProof"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ownership Proof / Serial Number</FormLabel>
                            <FormControl>
                              <Input placeholder="For physical assets" {...field} />
                            </FormControl>
                            <FormDescription>Serial number or ownership documentation</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Physical Redemption */}
                    <FormField
                      control={form.control}
                      name="physicalRedemption"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Physical Redemption / Custody Options</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="none" />
                                <Label htmlFor="none">Digital only</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="redeemable" id="redeemable" />
                                <Label htmlFor="redeemable">Redeemable for physical item</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchPhysicalRedemption === 'redeemable' && (
                      <FormField
                        control={form.control}
                        name="custodianInfo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custodian & Shipping Rules</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Custodian details, shipping rules, redemption process..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="provenanceNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provenance Notes / Prior Owners</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Historical ownership, exhibition history, etc..."
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>Optional historical information</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Access & Licenses Section */}
                <AccordionItem value="access">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Access, Unlockable Content & Licenses
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    {/* Unlockable Content */}
                    <FormField
                      control={form.control}
                      name="unlockableContent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Unlockable Content After Purchase</FormLabel>
                            <FormDescription>
                              Provide exclusive content only accessible to NFT owners
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchUnlockableContent && (
                      <FormField
                        control={form.control}
                        name="unlockUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unlock URL / Decryption Metadata</FormLabel>
                            <FormControl>
                              <Input placeholder="https://exclusive.example.com/content" {...field} />
                            </FormControl>
                            <FormDescription>Supabase path with access rules or external URL</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* License Type */}
                      <FormField
                        control={form.control}
                        name="licenseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License / Usage Rights</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all-rights">All Rights Reserved</SelectItem>
                                <SelectItem value="non-commercial">Non-commercial Use</SelectItem>
                                <SelectItem value="cc0">Creative Commons CC0</SelectItem>
                                <SelectItem value="cc-by">Creative Commons CC BY</SelectItem>
                                <SelectItem value="custom">Custom License</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Transfer Restrictions */}
                      <FormField
                        control={form.control}
                        name="transferRestrictions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Transfer Restrictions</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="transferable">Transferable</SelectItem>
                                <SelectItem value="restricted">Restricted Transfer</SelectItem>
                                <SelectItem value="soulbound">Soulbound (Non-transferable)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>Soulbound requires contract support</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Commercial Use */}
                      <FormField
                        control={form.control}
                        name="commercialUse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commercial Use Allowed?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="yes" id="comm-yes" />
                                  <Label htmlFor="comm-yes">Yes</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="no" id="comm-no" />
                                  <Label htmlFor="comm-no">No</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="contact" id="comm-contact" />
                                  <Label htmlFor="comm-contact">Contact for License</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchLicenseType === 'custom' && (
                      <FormField
                        control={form.control}
                        name="customLicense"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom License Text</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter your custom license terms..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Compliance & Safety Section */}
                <AccordionItem value="compliance">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Compliance, Identity & Safety
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* KYC Required */}
                      <FormField
                        control={form.control}
                        name="kycRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>KYC Required to Mint or Purchase</FormLabel>
                              <FormDescription>
                                Require identity verification
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* NSFW Flag */}
                      <FormField
                        control={form.control}
                        name="nsfwFlag"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Content Safety / NSFW Flag</FormLabel>
                              <FormDescription>
                                Triggers gating or restricted visibility
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchKycRequired && (
                      <FormField
                        control={form.control}
                        name="kycVerifier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>KYC Verifier & Required Fields</FormLabel>
                            <FormControl>
                              <Input placeholder="Specify verifier and required information" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="copyrightContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Copyright Dispute Contact</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="legal@example.com" {...field} />
                          </FormControl>
                          <FormDescription>Email for copyright-related inquiries</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Terms Acceptance */}
                    <FormField
                      control={form.control}
                      name="jurisdictionTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Jurisdiction / Legal Terms Acceptance *</FormLabel>
                            <FormDescription>
                              I confirm I own rights to tokenize this asset or have permission
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Advanced Options Section */}
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Advanced / Developer Options
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-6 pt-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Advanced options require technical knowledge. Proceed with caution.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* EIP-2981 Enforcement */}
                      <FormField
                        control={form.control}
                        name="eip2981Enforcement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>EIP-2981 (Royalty Standard) Enforcement</FormLabel>
                              <FormDescription>
                                Enforce royalties via contract standard
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Randomness/Reveal */}
                      <FormField
                        control={form.control}
                        name="randomnessReveal"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Randomness / Reveal Mechanics</FormLabel>
                              <FormDescription>
                                Chainlink VRF or server-signed reveal
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Batch Minting */}
                      <FormField
                        control={form.control}
                        name="batchMinting"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Batch Minting Options</FormLabel>
                              <FormDescription>
                                Enable batch processing for multiple tokens
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Audit Request */}
                      <FormField
                        control={form.control}
                        name="auditRequest"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Audit Request</FormLabel>
                              <FormDescription>
                                Request contract audit before public mint
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {watchBatchMinting && (
                      <FormField
                        control={form.control}
                        name="batchSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Batch Size</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="100"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormDescription>Number of tokens per batch</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Custom Contract Parameters */}
                    <FormField
                      control={form.control}
                      name="customContract"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Custom Contract Parameters</FormLabel>
                            <FormDescription>
                              Override default contract settings
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchCustomContract && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="ownerAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Owner Address</FormLabel>
                              <FormControl>
                                <Input placeholder="0x..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxSupply"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Supply</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="10000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Whitelist Upload */}
                    <FormField
                      control={form.control}
                      name="whitelistCsv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Whitelist / Allowlist Upload</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste CSV data or upload file with addresses and allocations..."
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>CSV format: address, allocation</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Submit Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Final Review & Confirmation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <div><strong>Estimated Gas Cost:</strong> {estimatedGas}</div>
                      <div><strong>Network:</strong> {form.watch('primaryChain')}</div>
                      <div><strong>Token Standard:</strong> {form.watch('tokenStandard')}</div>
                      <div><strong>Minting Mode:</strong> {form.watch('mintingMode')}</div>
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="submit" className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Confirm & Prepare NFT for Minting
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

export default FileDetailsForm;