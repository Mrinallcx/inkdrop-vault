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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="token">Token & Blockchain</TabsTrigger>
                  <TabsTrigger value="sales">Sales & Royalties</TabsTrigger>
                  <TabsTrigger value="advanced">Legal & Advanced</TabsTrigger>
                </TabsList>
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                placeholder="Concise description that will appear in metadata and marketplaces..."
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>Max 1000 characters. Used for metadata and listings.</FormDescription>
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
                            <FormLabel>Category Tags</FormLabel>
                            <FormControl>
                              <TagsInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="art, digital, collectible"
                              />
                            </FormControl>
                            <FormDescription>Help buyers discover your NFT. Press Enter to add tags.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Token & Blockchain Tab */}
                <TabsContent value="token" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Token & Blockchain Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
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

                        {/* Primary Chain */}
                        <FormField
                          control={form.control}
                          name="primaryChain"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Primary Chain *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="ethereum">
                                    <div className="flex items-center gap-2">
                                      <span>{chainIcons.ethereum}</span> Ethereum Mainnet
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="polygon">
                                    <div className="flex items-center gap-2">
                                      <span>{chainIcons.polygon}</span> Polygon
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="bnb">
                                    <div className="flex items-center gap-2">
                                      <span>{chainIcons.bnb}</span> BNB Smart Chain
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="arbitrum">
                                    <div className="flex items-center gap-2">
                                      <span>{chainIcons.arbitrum}</span> Arbitrum One
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="direct">Direct Minting (Immediate)</SelectItem>
                                  <SelectItem value="lazy">Lazy Minting (On Purchase)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>Direct = mint now, Lazy = mint when sold</FormDescription>
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="existing">Use Existing Contract</SelectItem>
                                  <SelectItem value="new">Deploy New Contract</SelectItem>
                                  <SelectItem value="factory">Factory Contract</SelectItem>
                                </SelectContent>
                              </Select>
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
                                  <SelectItem value="immutable">Immutable (Frozen)</SelectItem>
                                  <SelectItem value="mutable">Mutable (Updatable)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>Immutable = permanent, Mutable = can be updated</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Sales & Royalties Tab */}
                <TabsContent value="sales" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Sales & Royalties
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* List on Marketplace */}
                      <FormField
                        control={form.control}
                        name="listOnMarketplace"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                List on Marketplace After Minting
                              </FormLabel>
                              <FormDescription>
                                Automatically list your NFT for sale
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {watchListOnMarketplace && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Sale Type */}
                          <FormField
                            control={form.control}
                            name="saleType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sale Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="fixed">Fixed Price</SelectItem>
                                    <SelectItem value="auction">Timed Auction</SelectItem>
                                    <SelectItem value="not-for-sale">Not for Sale</SelectItem>
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
                                <FormLabel>Price</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.001"
                                    placeholder="0.1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
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
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ETH">ETH</SelectItem>
                                    <SelectItem value="MATIC">MATIC</SelectItem>
                                    <SelectItem value="BNB">BNB</SelectItem>
                                    <SelectItem value="USDC">USDC</SelectItem>
                                    <SelectItem value="USDT">USDT</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <Separator />

                      {/* Royalty Settings */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Royalty Settings</h3>
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
                                    step="0.5"
                                    placeholder="5"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormDescription>0-20% (recommended: 2.5-10%)</FormDescription>
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
                                  <Input 
                                    placeholder="0x..."
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>Wallet address to receive royalties</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Legal & Advanced Tab */}
                <TabsContent value="advanced" className="space-y-6 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Legal & Advanced Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* License Type */}
                      <FormField
                        control={form.control}
                        name="licenseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>License Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all-rights">All Rights Reserved</SelectItem>
                                <SelectItem value="non-commercial">Non-Commercial Use</SelectItem>
                                <SelectItem value="cc0">CC0 (Public Domain)</SelectItem>
                                <SelectItem value="cc-by">CC BY (Attribution)</SelectItem>
                                <SelectItem value="custom">Custom License</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {watchLicenseType === 'custom' && (
                        <FormField
                          control={form.control}
                          name="customLicense"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom License Terms</FormLabel>
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

                      {/* Commercial Use */}
                      <FormField
                        control={form.control}
                        name="commercialUse"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Commercial Use Permission</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="yes">Yes, allow commercial use</SelectItem>
                                <SelectItem value="no">No commercial use</SelectItem>
                                <SelectItem value="contact">Contact for permission</SelectItem>
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
                                <SelectItem value="transferable">Freely Transferable</SelectItem>
                                <SelectItem value="restricted">Transfer Restricted</SelectItem>
                                <SelectItem value="soulbound">Soulbound (Non-transferable)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Copyright Contact */}
                      <FormField
                        control={form.control}
                        name="copyrightContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Copyright Contact Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder="copyright@example.com"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>For copyright claims and inquiries</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* NSFW Flag */}
                      <FormField
                        control={form.control}
                        name="nsfwFlag"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                NSFW Content Warning
                              </FormLabel>
                              <FormDescription>
                                Check if content is not safe for work
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* KYC Required */}
                      <FormField
                        control={form.control}
                        name="kycRequired"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                KYC Required for Purchase
                              </FormLabel>
                              <FormDescription>
                                Require buyer identity verification
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Separator />

                      {/* Legal Terms Acceptance */}
                      <FormField
                        control={form.control}
                        name="jurisdictionTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                Legal Terms & Compliance *
                              </FormLabel>
                              <FormDescription>
                                I confirm that I have the right to mint this NFT and agree to the platform's terms of service, 
                                applicable laws, and regulations in my jurisdiction.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

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